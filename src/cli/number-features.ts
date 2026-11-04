import type Nixflex from '../index.js';
import type { NumberCredentials, GoogleCalendarSettingsPatch } from '../types/google-calendar.js';
import { featureError } from '../feature-errors.js';
export const k6Flags = {'return-url':{type:'string'},'credentials-stdin':{type:'boolean'}} as const;
export const k6Help = `
GOOGLE CALENDAR (owned number; consent link is opened by the human)
  integrations connectGoogleCalendar <number> --return-url https://app.example.test/done --confirm
  integrations getGoogleCalendar <number>
  integrations disconnectGoogleCalendar <number> --confirm
  integrations updateGoogleCalendarSettings <number> --body @calendar-settings.json --confirm
  PATCH: timezone, hours (all 7 days, null when closed), slot_minutes 15|30|45|60,
  calendar_id, send_invites (true|false). Omitted fields keep their saved values.
NUMBER CARRIER DETAILS (sensitive; never put credentials in command arguments)
  numbers updateCredentials <number> --provider twilio --confirm
  numbers updateCredentials <number> --provider telnyx --confirm --credentials-stdin
  Env: NIXFLEX_TWILIO_SID + NIXFLEX_TWILIO_TOKEN, or
       NIXFLEX_TELNYX_API_KEY + NIXFLEX_TELNYX_CONNECTION_ID.
  --credentials-stdin reads the exact JSON pair privately. No credential file/args.
  Writes without --confirm send ZERO requests. No automatic write retry.
`;
const calendarCommands = ['connectGoogleCalendar','getGoogleCalendar','disconnectGoogleCalendar','updateGoogleCalendarSettings'];
export const isK6 = (group: string, command: string) => group === 'integrations' && calendarCommands.includes(command)
  || group === 'numbers' && command === 'updateCredentials';
/** Run before parseArgs: parser diagnostics must never quote a supplied secret. */
export function guardCredentialArguments(args: string[]): void {
  const at=args.findIndex((s,i)=>s==='numbers'&&args[i+1]==='updateCredentials');
  if (at<0) return;
  const flags = new Set(['--confirm','--yes','-y','--json','--credentials-stdin','--help','-h']);
  if (!/^\+[1-9]\d{6,14}$/.test(args[at+2] || '')) throw new Error('Supply an E.164 number; credentials are private input only.');
  const options=[...args.slice(0,at),...args.slice(at+3)];
  for (let i=0;i<options.length;i++) {
    if (flags.has(options[i])) continue;
    if (['--provider','--base-url'].includes(options[i]) && options[i+1] && !options[i+1].startsWith('--')) { i++; continue; }
    throw new Error('Credential command accepts only number, provider, confirmation, output and private stdin flags. Never supply secret arguments.');
  }
}
async function credentialInput(provider: unknown, stdin: unknown): Promise<NumberCredentials> {
  if (!['twilio','telnyx'].includes(String(provider))) throw new Error('Use --provider twilio or telnyx.');
  const fields = provider === 'twilio' ? ['twilio_sid','twilio_token'] : ['telnyx_api_key','telnyx_connection_id'];
  if (stdin) {
    if (process.stdin.isTTY) throw new Error('Pipe private credential JSON to stdin; interactive echo is disabled.');
    let size=0;const chunks: Buffer[]=[];
    for await (const part of process.stdin) { const chunk=Buffer.from(part);size+=chunk.length;
      if(size>20000)throw new Error('Credential input is too large.');chunks.push(chunk); }
    let value: Record<string,unknown>;
    try { value=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Private stdin must contain one credential JSON object.'); }
    if(!value||Array.isArray(value)||Object.keys(value).length!==2||fields.some(k=>typeof value[k]!=='string'))
      throw new Error('Private stdin must contain exactly the selected carrier pair.');
    return value as unknown as NumberCredentials;
  }
  const env = provider === 'twilio' ? ['NIXFLEX_TWILIO_SID','NIXFLEX_TWILIO_TOKEN'] : ['NIXFLEX_TELNYX_API_KEY','NIXFLEX_TELNYX_CONNECTION_ID'];
  if (env.some(k=>!process.env[k])) throw new Error('Configure both selected carrier credentials privately in the environment. No request sent.');
  return Object.fromEntries(fields.map((k,i)=>[k,process.env[env[i]]])) as unknown as NumberCredentials;
}
/** Explicit projections: no arbitrary extras, OAuth tokens or raw error bodies. */
export function calendarOutput(value: unknown, command: string): unknown {
  const v=value as Record<string,unknown>;
  if (!v || typeof v !== 'object') throw featureError({status:0},'calendar',command!=='getGoogleCalendar');
  const fields = command === 'connectGoogleCalendar' ? ['url','expires_at'] : command === 'getGoogleCalendar'
    ? ['connected','account_email','calendar_id','connected_at','needs_reconnect','send_invites']
    : command === 'disconnectGoogleCalendar' ? ['ok','connected'] : ['timezone','hours','slot_minutes','calendar_id','send_invites'];
  if (command === 'connectGoogleCalendar') {
    let url: URL;try { url=new URL(String(v.url)); } catch { throw featureError({status:0},'calendar',true); }
    if (url.protocol!=='https:' || url.hostname!=='accounts.google.com' || url.username || url.password
      || ['access_token','refresh_token','id_token','code'].some(k=>url.searchParams.has(k))) throw featureError({status:0},'calendar',true);
  }
  const out=Object.fromEntries(fields.map(k=>[k,v[k]]));
  if ('hours' in out && out.hours && typeof out.hours==='object')
    out.hours=Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(k=>[k,(out.hours as Record<string,unknown>)[k]]));
  return out;
}
export async function k6Command(c: Nixflex, positions: string[], values: Record<string,unknown>, confirmed: boolean, body:()=>Record<string,unknown>) {
  const [group,command,number]=positions;
  if (command!=='getGoogleCalendar' && !confirmed) return {confirmation_required:true,sent:false,hint:'No request sent. Review this change, then add --confirm.'};
  if (!/^\+[1-9]\d{6,14}$/.test(number||'') || positions.length!==3) throw new Error('Supply exactly one owned E.164 number.');
  if (group==='numbers') return c.phoneNumbers.updateCredentials(number,await credentialInput(values.provider,values['credentials-stdin']));
  const r=c.integrations;
  const value=command==='connectGoogleCalendar' ? await r.connectGoogleCalendar(number,String(values['return-url']||''))
    : command==='getGoogleCalendar' ? await r.getGoogleCalendar(number)
    : command==='disconnectGoogleCalendar' ? await r.disconnectGoogleCalendar(number)
    : await r.updateGoogleCalendarSettings(number,body() as GoogleCalendarSettingsPatch);
  return calendarOutput(value,command);
}
