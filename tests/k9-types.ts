import Nixflex from '../dist/index.js';
import type {CallDeleteResponse,CampaignDeleteResponse,SmsCampaignDeleteResponse,ContentDeletePendingDetails} from '../dist/index.js';
declare const client:Nixflex;
type SmsReceipt=Awaited<ReturnType<typeof client.sms.campaigns.delete>>;
type VoiceReceipt=Awaited<ReturnType<typeof client.campaigns.delete>>;
declare const sms:SmsReceipt, voice:VoiceReceipt, call:CallDeleteResponse;
const smsId:string=sms.campaign_id, smsDeleted:true=sms.deleted;
const voiceId:string=voice.campaign_id, voiceDeleted:true=voice.deleted;
const cleanup:'carrier_best_effort'|'queued'=call.recording_cleanup;
const legacy:SmsCampaignDeleteResponse={message:'Campaign deleted'};
const pending:ContentDeletePendingDetails={deleted:false,retry_pending:true};
// @ts-expect-error B57 method receipts require identity and confirmation, unlike the legacy alias.
const missing:SmsReceipt={message:'Campaign deleted'};
// @ts-expect-error A queued error is not a successful deletion.
const queued:CampaignDeleteResponse={campaign_id:'id',deleted:false,message:'Queued'};
// @ts-expect-error Neither missing fields nor invented cleanup states prove recording erasure.
const bad:CallDeleteResponse={call_id:'id',deleted:true,recording_deleted:true,recording_cleanup:'complete'};
void [smsId,smsDeleted,voiceId,voiceDeleted,cleanup,legacy,pending,missing,queued,bad];
