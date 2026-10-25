import type { PhoneNumber, PhoneNumberUpdateParams } from '../dist/index.js';
const update: PhoneNumberUpdateParams = {
 inbound_enabled:false,outbound_enabled:false,monitor_enabled:true,web_calls_enabled:false,
 web_agent_enabled:true,web_functions_enabled:false,telnyx_public_key:'public-candidate',
 require_booking_confirmation:null,
};
const response: PhoneNumber = {phone_number:'+12025550100',agent_id:'a',inbound_enabled:true,outbound_enabled:true};
const provider: string | undefined = response.provider;
// @ts-expect-error Optional response provider cannot be promised as always present.
const requiredProvider: string = response.provider;
// @ts-expect-error The new switches accept booleans, not strings.
const wrong: PhoneNumberUpdateParams = {web_functions_enabled:'true'};
void [update,response,provider,requiredProvider,wrong];
