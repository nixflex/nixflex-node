import type {HttpClient,RequestOptions} from '../client.js';
export type OrganisationRole='owner'|'admin'|'member';
export interface OrganisationContext {organisation_id:string;key_id:string;name:string;role:OrganisationRole;permissions:string[];user_id:string|null;membership_version:number|null;joined_at:string|null;is_active:true;dashboard_state:"active"}
export interface OrganisationMember {user_id:string;email:string;name:string;role:OrganisationRole;joined_at:string;last_active_at?:string|null}
export interface OrganisationInvite {id:string;email:string;role:OrganisationRole;state:string;delivery:'pending'|'sent'|'failed'|'unknown';expires_at:string}
export interface OrganisationMembers {members:OrganisationMember[];invites:OrganisationInvite[];limits:{members:number;invites_per_day:number;invites_used_today?:number;seats_used?:number}}
export interface InvitationReceipt {id:string;delivery:string;expires_in?:number;created?:false}
export interface MembershipReceipt {user_id:string;state:'removed'|'active';live_disconnect_pending:boolean}
export interface ActivityFilters {before?:string;actor?:string;from?:string;to?:string}
export interface ActivityEvent {id:string;created_at:string;actor_id:string|null;actor:string;sentence:string;result:"Done"|"Not allowed"|"Not confirmed"}
export interface ActivityPage {events:ActivityEvent[];next_cursor:string|null}
/** Organisation API-key authority. Personal accept/leave/transfer/closure require a dashboard login. */
export class Organisation {
  constructor(private readonly http:HttpClient){}
  get(opts?:RequestOptions):Promise<OrganisationContext>{return this.http.request('GET','/organisation',undefined,undefined,opts)}
  members(opts?:RequestOptions):Promise<OrganisationMembers>{return this.http.request('GET','/organisation/members',undefined,undefined,opts)}
  invite(email:string,role:'admin'|'member'='member',opts?:RequestOptions):Promise<InvitationReceipt>{return this.http.request('POST','/organisation/invites',{email,role},undefined,opts)}
  resend(inviteId:string,opts?:RequestOptions):Promise<InvitationReceipt>{return this.http.request('POST','/organisation/invites/'+encodeURIComponent(inviteId)+'/resend',undefined,undefined,opts)}
  revoke(inviteId:string,opts?:RequestOptions):Promise<{id:string;state:string}>{return this.http.request('DELETE','/organisation/invites/'+encodeURIComponent(inviteId),undefined,undefined,opts)}
  removeMember(userId:string,opts?:RequestOptions):Promise<MembershipReceipt>{return this.http.request('DELETE','/organisation/members/'+encodeURIComponent(userId),undefined,undefined,opts)}
  setRole(userId:string,role:'admin'|'member',opts?:RequestOptions):Promise<MembershipReceipt>{return this.http.request('PATCH','/organisation/members/'+encodeURIComponent(userId),{role},undefined,opts)}
  activity(params:ActivityFilters={},opts?:RequestOptions):Promise<ActivityPage>{return this.http.request('GET','/organisation/activity',undefined,{...params},opts)}
  /** Default JSON page is 50 events. Keep IDs/cursors as strings; from/to are inclusive UTC dates. */
  activityCsv(params:ActivityFilters={},opts?:RequestOptions):AsyncGenerator<Uint8Array>{return this.http.stream('/organisation/activity',{...params,format:'csv'},opts)}
  /** Owner API-key authority; trims to 2..100 characters on the server. */
  rename(name:string,opts?:RequestOptions):Promise<{name:string}>{return this.http.request('PATCH','/organisation/name',{name},undefined,opts)}
  /** Claim an existing API-only account: sends a verified-email invitation, never transfers an owned account. */
  claimInvite(email:string,opts?:RequestOptions):Promise<InvitationReceipt>{return this.http.request('POST','/organisation/claim-invite',{email},undefined,opts)}
}
