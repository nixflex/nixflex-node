import Nixflex, {type PhoneNumberDetails,type PhoneNumberUpdateParams} from '../dist/index.js';
const client=new Nixflex({apiKey:'fixture:fixture'});
const switches:PhoneNumberUpdateParams={inbound_enabled:false,outbound_enabled:true,sms_reply_enabled:false,web_agent_enabled:true,web_calls_enabled:false,web_functions_enabled:false,monitor_enabled:true};
void client.phoneNumbers.update('+12025550100',switches);
void client.phoneNumbers.get('+12025550100');
void client.phoneNumbers.list({agent_id:'a',provider:'telnyx',limit:1,cursor:'opaque'});
declare const number:PhoneNumberDetails;
const effective:boolean=number.web_calls_effective;
const verified:boolean=number.telnyx_key_status.verified;
// @ts-expect-error origin is descriptive and read-only
number.source='dashboard';
// @ts-expect-error source is not an update setting
void client.phoneNumbers.update('+12025550100',{source:'api'});
// @ts-expect-error switches are booleans
void client.phoneNumbers.update('+12025550100',{web_agent_enabled:'true'});
void [effective,verified];
