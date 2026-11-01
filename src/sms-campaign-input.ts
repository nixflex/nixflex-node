/** Old JavaScript aliases are accepted only when unambiguous; the wire is canonical. */
export function smsCampaignInput<T extends object>(input: T): T {
  const data = { ...input } as Record<string, unknown>;
  for (const [alias, field] of [['message', 'message_template'], ['scheduled_at', 'scheduled_date']]) {
    if (Object.prototype.hasOwnProperty.call(data, alias)) {
      if (Object.prototype.hasOwnProperty.call(data, field)) throw new TypeError(`Use ${alias} or ${field}, not both.`);
      data[field] = data[alias]; delete data[alias];
    }
  }
  return data as T;
}
