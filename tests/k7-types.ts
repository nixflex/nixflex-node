import Nixflex, {prepareOutboundCall, CallBookings, OutboundCallRequest, OutboundRequestReceipt,
  NixflexOutboundRequestError, NixflexOutboundRequestPendingError} from '../dist/index';
const client=new Nixflex({apiKey:'fixture:fixture',baseUrl:'https://fixture.invalid'});
const params={agent_id:'agent',to_number:'+12025550100',prompt:'Synthetic purpose'};
async function check() {
  const legacy=await client.calls.create(params);
  const legacyTo:string=legacy.to;
  const prepared=prepareOutboundCall(params);
  const receipt:OutboundRequestReceipt=await client.calls.create(prepared);
  const optionalTo:string|undefined=receipt.to;
  // @ts-expect-error A replay omits to; never promise it exists for UUID creates.
  const replayTo:string=receipt.to;
  const bookings:CallBookings=await client.calls.bookings('call');
  if(bookings.state==='ready'){
    const service:string|number|null=bookings.result.timeline[0].service;
    const from:string|null=bookings.result.from;
    const status:'active'|'cancelled'=bookings.result.final[0].status;
  } else {
    const empty:null=bookings.result;
    // @ts-expect-error Non-ready states never carry content.
    const events=bookings.result.timeline;
  }
  const request:OutboundCallRequest=await client.calls.outboundRequest(prepared.request_id);
  const call:string|null=request.call_id;
  // @ts-expect-error Unknown is not a failed state.
  const failed:OutboundCallRequest={request_id:prepared.request_id,state:'failed',call_id:null,reason:null};
  const error:NixflexOutboundRequestError=new NixflexOutboundRequestPendingError(409,null);
  const code:string=error.code;
}
void check; // Typecheck only; never executes a request.
