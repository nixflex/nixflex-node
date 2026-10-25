import Nixflex, { type NumberUsageResponse, type NumberUsagePeriod } from '../src/index.js';
const client = new Nixflex({apiKey:'fixture:fixture'});
const period: NumberUsagePeriod = '30';
const result: Promise<NumberUsageResponse> = client.phoneNumbers.usage('+12025550100',{period,time_zone:'Europe/London'});
result.then(({usage})=>{const cost:string=usage.total_cost;const minutes:number=usage.minutes;void cost;void minutes;});
// @ts-expect-error Unsupported period.
client.phoneNumbers.usage('+12025550100',{period:'year'});
// @ts-expect-error The caller cannot select an owner.
client.phoneNumbers.usage('+12025550100',{owner:'other'});
