import type Nixflex from '../index.js';

/** Preview is local: no detail read and no DELETE until explicit confirmation. */
export async function deleteCampaign(client: Nixflex, id: string | undefined, confirmed: boolean) {
  if (!id) throw new Error('campaigns delete <campaign_id> --confirm');
  if (!confirmed) return {
    would_delete: 'voice campaign ' + id,
    warning: 'Waiting work will be cancelled and running calls ended. History and used charges remain; no refund.',
    hint: 'Add --confirm to proceed. A queued hang-up is not a completed deletion.',
  };
  return client.campaigns.delete(id);
}
