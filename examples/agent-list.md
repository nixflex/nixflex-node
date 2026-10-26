# Batch 2 draft: new agents and list pages

Requires this feature branch and the matching engine. Nothing is published here.
Configure your staging base URL and API key in memory, never in committed files.
Creating an agent does not import a number or start a call.

```ts
const made = await client.agents.create({name: 'Support'});
// New: dynamic_greeting=true, max_call_duration_seconds=300, silence_hangup_seconds=10.
// timezone: valid account zone, otherwise UTC (there is no API browser zone).
const explicit = await client.agents.create({name: 'Custom', dynamic_greeting: false,
  welcome_message: 'Hello.', max_call_duration_seconds: 600, silence_hangup_seconds: 30});
const page = await client.agents.list({status:'all',search:'Support',limit:50,offset:50});
for await (const agent of client.agents.iter(200)) { /* all active agents, not just 200 */ }
await client.agents.delete(made.agent_id); // switches off only; no permanent erase
await client.agents.delete(explicit.agent_id);
```

Explicit valid 0/false/nullable timers are preserved. PUT never reapplies create defaults.
No existing agents, pickup handling, billing or call routing change. Retention still
inherits the account default on create. Node create/update/read types stay separate;
read-only identity/history fields are not accepted as typed write fields.

```powershell
nixflex agents list --status all --search 'Support' --limit 50 --offset 50 --json
```

List bounds: limit 1..200; offset 0..1000000; search at most 200 characters, no controls.
Status: active (default), disabled, all. Name/ID matching is case-insensitive and literal.
Engine/CLI invalid bounds fail clearly instead of clamping. Iterator pageSize outside
integer 1..200 throws before HTTP; use 200, not 500. An exact full final page triggers
one more GET to discover the empty page. The iterator throws at the offset bound
rather than returning an incomplete successful result. Offset pages are not snapshots
under concurrent writes; ordering is created_at DESC, agent_id DESC.
