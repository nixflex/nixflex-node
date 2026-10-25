import Nixflex, { type AgentCreateParams, type AgentUpdateParams, type AgentDeleteResponse } from '../src/index.js';
const client = new Nixflex({ apiKey: 'fixture:fixture' });
const body: AgentCreateParams = { name: 'Contract', temperature: 0, response_eagerness: 0, stt_confidence: 0,
  stt_max_silence_ms: 0, timezone: 'Europe/London', voice_key: null, incall_sms_enabled: false,
  post_call_sms_enabled: true, post_call_sms_template: 'Thanks', voicemail_leave_enabled: true,
  voicemail_message: 'Please call back', data_extraction_fields: [{ name: 'interested', type: 'boolean', optional: true }] };
const update: AgentUpdateParams = { ...body, call_retention_days: 7 };
client.agents.create(body); client.agents.update('agent_example', update);
const removed: Promise<AgentDeleteResponse> = client.agents.delete('agent_example');
removed.then(r => { const text: string = r.message; void text; });
// @ts-expect-error Retention inherits the account default on create.
const wrong: AgentCreateParams = { call_retention_days: 7 }; void wrong;
// @ts-expect-error No string booleans.
const bool: AgentCreateParams = { incall_sms_enabled: 'false' }; void bool;
