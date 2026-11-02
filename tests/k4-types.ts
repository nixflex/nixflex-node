import Nixflex, { type ActivityEvent, type CustomFunctionInput } from '../dist/index.js';
const c = new Nixflex({apiKey:'fixture:fixture'});
async function check() {
  const page = await c.organisation.activity({from:'2026-10-01',to:'2026-10-31',before:'999999999999999999'});
  const row: ActivityEvent = page.events[0];
  const id: string = row.id, text: string = row.sentence;
  const result: 'Done'|'Not allowed'|'Not confirmed' = row.result;
  // @ts-expect-error Activity IDs must not be treated as JS numbers.
  const wrongId: number = row.id;
  // @ts-expect-error Raw action/detail are not returned by the API display projection.
  row.action;
  for await (const bytes of c.organisation.activityCsv()) { const chunk: Uint8Array = bytes; }
  await c.organisation.rename('Example business');
  const config = await c.integrations.get('calcom','+12025550123');
  const keyPresent: boolean = config.api_key_set;
  // @ts-expect-error Private API keys are not returned.
  config.api_key;
  await c.integrations.set('calcom','+12025550123',{api_key:'fixture',username:'fixture',event_slug:'fixture',is_active:false});
  // @ts-expect-error Required credential and event fields cannot be omitted.
  await c.integrations.set('calcom','+12025550123',{is_active:false});
  await c.integrations.set('make','+12025550123',{in_call_url:'https://example.invalid',parameters:{}});
  // @ts-expect-error Make requires at least one URL.
  await c.integrations.set('make','+12025550123',{is_active:false});
  // @ts-expect-error Monitor is non-public.
  await c.integrations.get('monitor','+12025550123');
  const input: CustomFunctionInput = {name:'lookup',url:'https://example.invalid',speak_during:null,is_active:false,timeout_ms:0};
  await c.integrations.createFunction('+12025550123',input);
  await c.integrations.updateFunction('+12025550123','f',{speak_during:null,headers:{}});
  const webhook = await c.webhooks.get('+12025550123');
  const url: string|null|undefined = webhook.webhook_url;
  const ctx = await c.organisation.get();
  const user: string|null = ctx.user_id;
}
void check;
