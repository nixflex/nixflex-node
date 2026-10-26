// Single-call CLI boundary only. Batch recipient variables keep their own contract.
export function callCreateBody(body: Record<string, unknown>, variables?: Record<string, string>): Record<string, unknown> {
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  if ((has('variables') && has('dynamic_vars')) || (variables !== undefined && (has('variables') || has('dynamic_vars')))) {
    throw new Error('Use only one of --var, variables or dynamic_vars for a single call.');
  }
  const { variables: alias, ...rest } = body;
  if (variables !== undefined) rest.dynamic_vars = variables;
  else if (has('variables')) rest.dynamic_vars = alias;
  return rest;
}
