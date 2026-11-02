import type Nixflex from '../index.js';
import type { IntegrationProvider } from '../types/integrations.js';
import { privateIntegration } from './integration-output.js';
export const integrationsHelp = `
INTEGRATION SETTINGS (private input; no credential output)
  integrations get <provider> <number>
  integrations set <provider> <number> --body @private-settings.json --confirm
  integrations delete <provider> <number> --confirm
  integrations getAgentPrecall <agent-id>
  integrations setAgentPrecall <agent-id> --body @private-settings.json --confirm
  integrations deleteAgentPrecall <agent-id> --confirm
  integrations listFunctions <number>
  integrations createFunction <number> --body @private-function.json --confirm
  integrations updateFunction <number> <function-id> --body @private-function.json --confirm
  integrations deleteFunction <number> <function-id> --confirm
  Providers: calcom | slack | zapier | make | gohighlevel | webhook | webhook2 | precall | web-calls
  PUT replaces provider config; PATCH changes supplied function fields only.
  URLs, headers and free-form configuration are omitted from output.
  New writes without --confirm send ZERO requests. Successful writes need manual tests.
`;
export async function integrationsCommand(c: Nixflex, positions: string[], body: Record<string, unknown>, confirmed: boolean) {
  const [, command, a, b] = positions;
  const read = ['get', 'getAgentPrecall', 'listFunctions'].includes(command);
  const write = ['set', 'delete', 'setAgentPrecall', 'deleteAgentPrecall', 'createFunction', 'updateFunction', 'deleteFunction'].includes(command);
  if (!read && !write) throw new Error('Unknown integrations command. Run nixflex --help.');
  if (write && !confirmed) return { confirmation_required: true, sent: false, hint: 'No request sent. Review the change privately, then add --confirm.' };
  if (!a || (['get', 'set', 'delete', 'updateFunction', 'deleteFunction'].includes(command) && !b)) throw new Error('Supply the required integration identifiers.');
  const r = c.integrations;
  return privateIntegration(() => {
    if (command === 'get') return r.get(a as IntegrationProvider, b);
    if (command === 'set') return r.set(a as IntegrationProvider, b, body as never);
    if (command === 'delete') return r.delete(a as IntegrationProvider, b);
    if (command === 'getAgentPrecall') return r.getAgentPrecall(a);
    if (command === 'setAgentPrecall') {
      if (typeof body.url !== 'string') throw new Error('A private URL is required.');
      return r.setAgentPrecall(a, body.url);
    }
    if (command === 'deleteAgentPrecall') return r.deleteAgentPrecall(a);
    if (command === 'listFunctions') return r.listFunctions(a);
    if (command === 'createFunction') return r.createFunction(a, body as never);
    if (command === 'updateFunction') return r.updateFunction(a, b, body);
    return r.deleteFunction(a, b);
  });
}
