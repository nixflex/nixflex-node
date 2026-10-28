import type Nixflex from '../index.js';
export const organisationHelp='\nORGANISATION (candidate; not enabled)\n'+[
 'organisation get','organisation members','organisation activity [--set before=123 --set actor=UUID]',
 'organisation invite --set email=person@example.com --set role=member',
 'organisation claim --set email=owner@example.com','organisation resend INVITE_ID',
 'organisation revoke INVITE_ID','organisation remove USER_ID','organisation role USER_ID --set role=admin'
].map(line=>'  '+line).join('\n')+'\nChanges preview unless --confirm is supplied. Personal owner actions require the dashboard.\n';
export async function organisationCommand(client:Nixflex,command:string,id:string|undefined,body:Record<string,unknown>,confirmed:boolean){
 const org=client.organisation;
 if(command==='get')return org.get();
 if(command==='members')return org.members();
 if(command==='activity')return org.activity({before:typeof body.before==='string'?body.before:undefined,actor:typeof body.actor==='string'?body.actor:undefined});
 if(!['invite','claim','resend','revoke','remove','role'].includes(command))throw Error('organisation: get | members | activity | invite | claim | resend | revoke | remove | role');
 if(!confirmed)return {would_change:'organisation '+command,target:id||body.email||null,hint:'Review the person or invitation, then add --confirm. Removal never rolls the shared API key.'};
 if(['invite','claim'].includes(command)){
  if(typeof body.email!=='string'||!body.email.includes('@'))throw Error('Pass --set email=person@example.com');
  if(command==='claim')return org.claimInvite(body.email);
  const role=body.role===undefined?'member':body.role;if(role!=='member'&&role!=='admin')throw Error('Use --set role=member or role=admin');
  return org.invite(body.email,role);
 }
 if(!id)throw Error('Pass the person or invitation ID.');
 if(command==='resend')return org.resend(id);
 if(command==='revoke')return org.revoke(id);
 if(command==='remove')return org.removeMember(id);
 if(body.role!=='admin'&&body.role!=='member')throw Error('Use --set role=member or role=admin');
 return org.setRole(id,body.role);
}
