import type Nixflex from '../index.js';
import { prepareOutboundCall } from '../call-requests.js';
import { requestId } from '../call-request-projection.js';
import { callCreateBody } from './call-create.js';
import { contactFields } from './kit-fields.js';
import { knowledgeOutput } from './knowledge-output.js';
import type { OutboundCallParams } from '../types/calls.js';

export const callRequestFlags = {'request-id':{type:'string'}} as const;
export const callRequestHelp = `
CALL BOOKING RESULT / DURABLE REQUESTS
  calls bookings <call_id>       ready | none | processing | deleted | unavailable
  calls outboundRequest <UUID>   pending | accepted | rejected | unknown; GET only
  calls prepare --agent ID --to +44... --prompt TEXT|@file [--from +44...] [--var k=v] [--body @file]
                [--output prepared.json | --json]
                                Generate a UUID locally; sends NOTHING. --output never overwrites.
  calls create --body @prepared.json   Send the saved body once. Reuse it unchanged only after checking.
  calls create ... --request-id UUID   Explicit existing UUID; no automatic retry/new ID.
  Save prepare's JSON before first send. It contains your call inputs; keep it private.
  After an uncertain result read the request and Call History; never run prepare again as a retry.
`;
export function withCallRequestId(body: Record<string,unknown>, value: unknown) {
  if (value === undefined) return body;
  const id = requestId(value);
  if (body.request_id !== undefined && requestId(body.request_id).toLowerCase() !== id.toLowerCase()) throw new Error('Supply request_id once, or use the same UUID in both places.');
  return {...body,request_id:id};
}
export async function prepareCallCli(values: Record<string,unknown>, body: Record<string,unknown>, prompt?: string) {
  const vars: Record<string,string> = {};
  for (const entry of values.var as string[] || []) {
    const at=entry.indexOf('=');if(at<1)throw new Error('--var requires key=value.');vars[entry.slice(0,at)]=entry.slice(at+1);
  }
  const named = {agent_id:values.agent,to_number:values.to,from_number:values.from,prompt,...contactFields(values)};
  const input = {...body,...Object.fromEntries(Object.entries(named).filter(([,v]) => v !== undefined))};
  if(!input.agent_id || !input.to_number || !input.prompt)throw new Error('calls prepare requires agent, to number and prompt. No call was placed.');
  const prepared = prepareOutboundCall(withCallRequestId(callCreateBody(input,values.var===undefined?undefined:vars),values['request-id']) as unknown as OutboundCallParams);
  if(values.output===undefined)return prepared;
  // Reuse the existing exclusive UTF-8 writer; never depend on shell redirection encoding.
  const chunks=async function*(){yield Buffer.from(JSON.stringify(prepared,null,2)+'\n','utf8');};
  const saved=await knowledgeOutput(chunks(),values.output as string);
  return {...saved,request_id:prepared.request_id,sent:false};
}
export async function callRequestRead(client: Nixflex, command: string, id?: string) {
  if(!id)throw new Error('Supply the call ID or request UUID.');
  return command==='bookings'?client.calls.bookings(id):client.calls.outboundRequest(id);
}
