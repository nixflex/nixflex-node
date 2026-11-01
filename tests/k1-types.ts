import type { SmsSendParams, SmsCampaignCreateParams, SmsCampaignDetail, SmsCampaignDeleteResponse,
  SmsCampaignLaunchResponse, BatchLaunchResponse, Usage, Call, AgentCreateParams } from '../dist/index.js';
const sms: SmsSendParams = {agent_id:'a',from_number:'+12025550100',to:'+12025550101',message:'hi',recipient_country:'US',context:{reply_context:'text'}};
// @ts-expect-error SMS needs an explicit sender.
const noSender: SmsSendParams = {agent_id:'a',to:'+12025550101',message:'hi'};
const campaign: SmsCampaignCreateParams = {agent_id:'a',from_number:'n',message_template:'Hi',recipients:[{phone:'n',country:'US',timezone:'America/New_York'}],consent_confirmed:false,allow_wider_hours:false,scheduled_date:'2026-12-01'};
const empty: AgentCreateParams = {};
declare const detail: SmsCampaignDetail, call: Call, usage: Usage;
const cursor: string | null = detail.pagination.recipient_cursor;
const sent: number | undefined = detail.campaign.sent_count;
const phone: string = detail.recipients[0].phone_number;
const deleted: SmsCampaignDeleteResponse = {message:'Campaign deleted'};
const launch: BatchLaunchResponse = {campaign_id:'a',status:'launching',enqueued:0,failed_to_enqueue:1};
const smsLaunch: SmsCampaignLaunchResponse = {status:'running',sent:1,failed:0,held:2,total_segments:1,safe_to_retry:false};
void [sms,noSender,campaign,empty,cursor,sent,phone,deleted,launch,smsLaunch,usage.occupied_call_slots,usage.capacity_source,usage.capacity_measured_since,call.recording_status,call.recording_endpoint];
