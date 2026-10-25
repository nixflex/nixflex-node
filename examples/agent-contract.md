# Agent contract — feature-branch example (not a published package)

Use a staging client configured with your secret in memory. This creates a new unbound
agent; it does not make a call or send a message. Do not run against a real live agent.

```ts
import Nixflex from 'nixflex';
const client = new Nixflex({ apiKey: process.env.NIXFLEX_API_KEY!, baseUrl: process.env.NIXFLEX_BASE_URL! });
const agent = await client.agents.create({ name: 'Contract check', temperature: 0,
  response_eagerness: 0, stt_confidence: 0, stt_max_silence_ms: 0, timezone: 'Europe/London',
  incall_sms_enabled: true, post_call_sms_enabled: true, post_call_sms_template: 'Thanks for calling.',
  voicemail_leave_enabled: true, voicemail_message: 'Please call us back.',
  data_extraction_fields: [{ name: 'interested', type: 'boolean', optional: true }] });
const saved = await client.agents.get(agent.agent_id);
console.log(saved.temperature, saved.incall_sms_enabled, saved.voicemail_message);
console.log(await client.agents.delete(agent.agent_id)); // {message:'Agent deleted'} = soft disable
```

CLI (after configuring a staging base URL/key; no secret on the command line):

```powershell
nixflex agents create --name 'Contract check' --prompt 'Help the caller.' --set temperature=0 --set response_eagerness=0 --set incall_sms_enabled=true --set post_call_sms_enabled=true --set 'post_call_sms_template=Thanks for calling.' --set voicemail_leave_enabled=true --set 'voicemail_message=Please call us back.' --json
nixflex agents get AGENT_ID --json
nixflex agents update AGENT_ID --set typo_field=true --json
nixflex agents delete AGENT_ID --confirm --json
```

Strings in --set are plain text; arrays/objects are JSON. --body @file.json also works.
The unknown-only update should fail clearly. Mixed unknown keys return warnings; inspect them.
Numbers/booleans are strict; explicit 0/false stay. Temperature 0..0.7; pickup behavior unchanged.
Create inherits account retention; AgentUpdateParams alone has call_retention_days (90/30/7/1/0).
A 503 is not proof that a write did not happen: read before retrying.
