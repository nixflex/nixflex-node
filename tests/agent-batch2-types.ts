import Nixflex, { type Agent, type AgentCreateParams, type AgentUpdateParams, type AgentListParams } from '../src/index.js';
const c = new Nixflex({apiKey:'fixture:fixture'});
const page: AgentListParams = {status:'disabled',search:'Support',limit:200,offset:200};
c.agents.list(page);
const create: AgentCreateParams = {dynamic_greeting:false,temperature:0,max_call_duration_seconds:null};
const update: AgentUpdateParams = {...create,call_retention_days:7};
c.agents.create(create); c.agents.update('a',update);
function read(agent: Agent) { const id: string | undefined = agent.api_key_id; const zone: string | null | undefined = agent.timezone; void id; void zone; }
void read;
// @ts-expect-error read-only identity is not writable
const badCreate: AgentCreateParams = {agent_id:'a'}; void badCreate;
// @ts-expect-error read-only fields are not writable
const badUpdate: AgentUpdateParams = {created_at:'now'}; void badUpdate;
// @ts-expect-error retention is update-only
const badRetention: AgentCreateParams = {call_retention_days:7}; void badRetention;
// @ts-expect-error no invented status
c.agents.list({status:'inactive'});
