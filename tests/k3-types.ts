import Nixflex, {ContactPreviewResponse, WebAgentReadResponse, InboxThreadResponse} from '../dist/index.js';
declare const c: Nixflex;
declare const preview: ContactPreviewResponse;
const estimate: string | undefined = preview.rows[0].next_allowed?.at_utc;
declare const web: WebAgentReadResponse;
const colour: string | undefined = web.web_appearance?.colour;
declare const thread: InboxThreadResponse;
const version: string = thread.read_version;
c.campaigns.create({agent_id:'a',from_number:'+12025550123',prompt:'Hi',recipients:[{phone:'+12025550124',variables:{amount:1,known:false,nested:{a:'b'}},prompt_override:null}],scheduled_date:null,window_start_minutes:0,window_end_minutes:null,window_days:null,timezone:null});
c.sms.campaigns.create({agent_id:'a',from_number:'+12025550123',message_template:'Hi',recipients:[{phone:'+12025550124',variables:{count:1}}],reply_context_prompt:null});
c.campaigns.cancel('c');c.campaigns.resume('c');c.campaigns.consent('c',{event:'consent_withdrawn',confirmed:true});
c.campaigns.list({status:'running',limit:50});
c.sms.campaigns.list({status:'future_status',before:'opaque+/='});
c.sms.campaigns.update('c',{is_active:false,reply_context_prompt:null,reply_window_hours:1});
c.sms.campaigns.cancel('c');c.sms.campaigns.consent('c',{event:'consent',confirmed:true});c.sms.campaigns.resume('c');
c.contacts.preview({agent_id:'a',recipients:[{phone:'+12025550124',country:'US',timezone:'America/New_York'}],campaign:{allow_wider_hours:false,start:'09:00',end:'17:00',days:['mon']}});
c.contacts.add({phone_numbers:['+12025550124'],channel:'sms'});c.contacts.remove({phone_number:'+12025550124'});c.contacts.list({after:'+12025550124'});
c.webAgent.update('+12025550123',{revision:'999999999999999999',settings:{web_prompt:'',web_calls_enabled:false}});
c.inbox.list('web','+12025550123',{archived:false,unread:true,period:'7',offset:0});
c.inbox.thread('web','+12025550123','v',{before:'2030-01-01T00:00:00Z',before_id:'9223372036854775807'});
c.inbox.update('web','+12025550123','v',{read_version:version,archived:false});
c.inbox.numbers({offset:0});c.inbox.retention({number:'+12025550123'});c.inbox.features();
// @ts-expect-error preserve large revision strings, never floating-point numbers
c.webAgent.update('+12025550123',{revision:999999999999999999,settings:{web_name:''}});
// @ts-expect-error read versions must be strings
c.inbox.update('web','+12025550123','v',{read_version:1});
void estimate;void colour;
