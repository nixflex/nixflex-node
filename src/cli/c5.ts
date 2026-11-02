import type Nixflex from '../index.js';

export const c5Groups = ['contacts', 'web-agent', 'inbox'];
export const c5Flags = Object.fromEntries(['channel', 'after', 'archived', 'unread', 'before-id', 'thread', 'number']
  .map(key => [key, { type: 'string' as const }]));
export const c5Help = `
C5 CAMPAIGNS AND CONVERSATIONS
  campaigns list [--status S] [--limit N]   default 50; cap 200; no cursor
  campaigns cancel <id> --confirm          in-progress work may finish
  campaigns consent <id> --body @consent.json --confirm
  campaigns resume <id> --confirm          one page only; may dial real people
  sms campaigns update <id> --body @settings.json --confirm
  sms campaigns cancel <id> --confirm
  sms campaigns consent <id> --body @consent.json --confirm
  sms campaigns resume <id> --confirm      one page only; may send real texts
  contacts preview --body @preview.json    advisory, not permission to contact
  contacts list [--channel all|voice|sms] [--after NUMBER]   separate buckets, 200/page
  contacts add --body @numbers.json --confirm
  contacts remove --body @number.json --confirm   may enable scheduled outreach
  web-agent get <number>
  web-agent update <number> --body @settings.json --confirm   string revision, full appearance
  inbox list <sms|web> <number> [--archived true|false] [--unread true|false]
       [--search TEXT] [--since ISO | --period all|today|7|30|90] [--limit N] [--offset N]
  inbox thread <sms|web> <number> --thread ID [--limit N] [--before ISO --before-id ID]
  inbox update <sms|web> <number> --thread ID --body @change.json --confirm
  inbox features
  inbox numbers [--offset N]               100/page; agents capped at 1,000
  inbox retention [--number NUMBER]
  Reads never acknowledge messages. Preserve string read_version; archive is not erasure.
  Campaign creation is executable work, NOT a draft. Writes never auto-retry.
`;

export function isC5(group: string, cmd: string, sub?: string): boolean {
  return c5Groups.includes(group) || (group === 'campaigns' && ['list', 'cancel', 'consent', 'resume'].includes(cmd)) ||
    (group === 'sms' && cmd === 'campaigns' && ['update', 'cancel', 'consent', 'resume'].includes(sub || ''));
}
export async function c5Command(c: Nixflex, pos: string[], values: Record<string, unknown>,
  body: Record<string, unknown>, confirmed: boolean): Promise<unknown> {
  const [group, cmd, a1, a2] = pos;
  const str = (key: string) => values[key] as string | undefined;
  const num = (key: string) => values[key] === undefined ? undefined : Number(values[key]);
  const bool = (key: string) => {
    if (values[key] === undefined) return undefined;
    if (values[key] !== 'true' && values[key] !== 'false') throw new Error('--' + key + ' must be true or false.');
    return values[key] === 'true';
  };
  const required = (value: string | undefined, name: string): string => {
    if (!value) throw new Error('Supply ' + name + '.');
    return value;
  };
  const write = async (action: () => Promise<unknown>) => confirmed ? action() : {
    confirmation_required: true, hint: 'No request sent. Add --confirm only for this intentional change. Never repeat an uncertain write.' };
  if (group === 'campaigns' || group === 'sms') {
    const action = group === 'sms' ? a1 : cmd;
    const resource = group === 'sms' ? c.sms.campaigns : c.campaigns;
    if (action === 'list') return c.campaigns.list({ status: str('status'), limit: num('limit') });
    const id = required(group === 'sms' ? a2 : a1, 'campaign id');
    if (action === 'cancel') return write(() => resource.cancel(id));
    if (action === 'resume') return write(() => resource.resume(id));
    if (action === 'consent') return write(() => resource.consent(id, body as never));
    if (group === 'sms' && action === 'update') return write(() => c.sms.campaigns.update(id, body as never));
  }
  if (group === 'contacts') {
    if (cmd === 'preview') return c.contacts.preview(body as never);
    if (cmd === 'list') return c.contacts.list({ channel: str('channel') as never, after: str('after') });
    if (cmd === 'add') return write(() => c.contacts.add(body as never));
    if (cmd === 'remove') return write(() => c.contacts.remove(body as never));
  }
  if (group === 'web-agent') {
    const number = required(a1, 'number');
    if (cmd === 'get') return c.webAgent.get(number);
    if (cmd === 'update') return write(() => c.webAgent.update(number, body as never));
  }
  if (group === 'inbox') {
    if (cmd === 'features') return c.inbox.features();
    if (cmd === 'numbers') return c.inbox.numbers({ offset: num('offset') });
    if (cmd === 'retention') return c.inbox.retention({ number: str('number') });
    const channel = required(a1, 'channel') as 'sms' | 'web', number = required(a2, 'number');
    if (cmd === 'list') return c.inbox.list(channel, number, { archived: bool('archived'), unread: bool('unread'),
      search: str('search'), since: str('since'), period: str('period') as never, limit: num('limit'), offset: num('offset') });
    const thread = required(str('thread'), '--thread');
    if (cmd === 'thread') return c.inbox.thread(channel, number, thread, { limit: num('limit'), before: str('before'), before_id: str('before-id') });
    if (cmd === 'update') return write(() => c.inbox.update(channel, number, thread, body as never));
  }
  throw new Error('Unknown C5 command. Run nixflex --help.');
}
