import type {HttpClient,RequestOptions} from '../client.js';
export type OrganisationRole='owner'|'admin'|'member';
export interface OrganisationContext {organisation_id:string;key_id:string;name:string;role:OrganisationRole;permissions:string[]}
export interface OrganisationMember {user_id:string;email:string;name:string;role:OrganisationRole;joined_at:string}
export interface OrganisationInvite {id:string;email:string;role:OrganisationRole;state:string;delivery:'pending'|'sent'|'failed'|'unknown';expires_at:string}
export interface OrganisationMembers {members:OrganisationMember[];invites:OrganisationInvite[];limits:{members:number;invites_per_day:number}}
export interface InvitationReceipt {id:string;delivery:string;expires_in?:number}
export interface MembershipReceipt {user_id:string;state:'removed'|'active';live_disconnect_pending:boolean}
export interface ActivityEvent {id:number;created_at:string;actor_id:string|null;actor_kind:string;actor:string;action:string;target:string|null;result:string;detail:Record<string,unknown>}
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
  activity(params:{before?:string;actor?:string}={},opts?:RequestOptions):Promise<ActivityPage>{return this.http.request('GET','/organisation/activity',undefined,{...params},opts)}
  /** Claim an existing API-only account: sends a verified-email invitation, never transfers an owned account. */
  claimInvite(email:string,opts?:RequestOptions):Promise<InvitationReceipt>{return this.http.request('POST','/organisation/claim-invite',{email},undefined,opts)}
}
