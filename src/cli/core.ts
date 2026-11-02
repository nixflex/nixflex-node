import Nixflex from '../index.js';
import type { VoiceListParams } from '../types/core.js';

export const coreGroups = ['account', 'voices'];
export const coreFlags = {
  gender: { type: 'string' as const }, locale: { type: 'string' as const },
  availability: { type: 'string' as const }, 'agent-language': { type: 'string' as const },
};
export const coreHelp = `
CORE READS
  calls list [--limit N] [--offset N]   legacy array; --agent selects filtered history
  callers import <number> --body @callers.json   preserves null clears and numeric values
  account retention              saved default for new agents; not proof of erasure
  keys activity [--period today|7d]
  voices list [--language en] [--gender female|male|unknown] [--locale en-GB]
              [--agent ID | --agent-language multi] [--availability active|all] [--limit N] [--cursor CURSOR]
  voices get <voice_key> [--agent ID | --agent-language multi]
  keys create [--name NAME] [--email EMAIL] --confirm --json
              unauthenticated, separate API-only account; no automatic retry
              redirect stdout to your secret store; never print/share the returned secret
`;

export async function createAccount(body: Record<string, unknown>, confirmed: boolean, baseUrl?: string) {
  if (!confirmed) return { would_create: 'A separate API-only account (not an extra key on this account)',
    warning: 'The result contains a secret. Save it securely; do not log it. No public account deletion API exists.',
    hint: 'Add --confirm only for intentional signup. A lost response must be reconciled, never blindly repeated.' };
  for (const [key, value] of Object.entries(body)) {
    if (!['name', 'email'].includes(key) || (value !== null && typeof value !== 'string'))
      throw new Error('keys create accepts only name and email (string or null).');
  }
  return Nixflex.createKey(body, baseUrl);
}

export async function coreRead(client: Nixflex, group: string, cmd: string, id: string | undefined,
  values: Record<string, unknown>) {
  const s = (key: string) => values[key] as string | undefined;
  if (group === 'account' && cmd === 'retention') return client.account.retention();
  if (group === 'keys' && cmd === 'activity')
    return client.keys.activity({ period: s('period') as 'today' | '7d' | undefined });
  if (group === 'voices') {
    const context = { agent_id: s('agent'), agent_language: s('agent-language') };
    if (cmd === 'get' && id) return client.voices.get(id, context);
    if (cmd === 'list') return client.voices.list({ ...context, language: s('language'),
      gender: s('gender') as VoiceListParams['gender'], locale: s('locale'),
      availability: s('availability') as VoiceListParams['availability'],
      limit: s('limit') === undefined ? undefined : Number(s('limit')), cursor: s('cursor') });
  }
  throw new Error('Use account retention, keys activity, voices list, or voices get <voice_key>.');
}
