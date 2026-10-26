import { parseTree, getNodeValue, findNodeAtLocation, modify, applyEdits, visit } from 'jsonc-parser';
export function planConfigEdit(text, name, entry, format = 'jsonc') {
  if (format === 'json') {
    try { JSON.parse(text); } catch { throw new Error('Malformed strict JSON configuration; nothing changed.'); }
  }
  const errors = [], tree = parseTree(text, errors, { allowTrailingComma: true });
  if (errors.length || !tree || tree.type !== 'object') throw new Error('Malformed MCP configuration; nothing changed.');
  const stack = [];
  visit(text, {
    onObjectBegin() { stack.push(new Set()); },
    onObjectProperty(key) { const set = stack.at(-1); if (set.has(key)) throw new Error('Duplicate configuration property; nothing changed.'); set.add(key); },
    onObjectEnd() { stack.pop(); },
  });
  const root = getNodeValue(tree);
  if (root.mcpServers !== undefined && (!root.mcpServers || typeof root.mcpServers !== 'object' || Array.isArray(root.mcpServers)))
    throw new Error('Invalid mcpServers section; nothing changed.');
  const previous = root.mcpServers?.[name];
  const same = (a, b) => JSON.stringify(sort(a)) === JSON.stringify(sort(b));
  if (same(previous, entry)) return { text, changed: false, replacing: false, preview: [] };
  const oldNode = findNodeAtLocation(tree, ['mcpServers', name]);
  if (oldNode) {
    let commented = false;
    visit(text.slice(oldNode.offset, oldNode.offset + oldNode.length), { onComment() { commented = true; } });
    if (commented) throw new Error('Existing Nixflex entry has comments. Review it manually; nothing changed.');
  }
  // No formatter: only the target insertion/replacement may change bytes.
  const output = applyEdits(text, modify(text, ['mcpServers', name], entry, {}));
  // Never display arbitrary prior values: even command/args can contain passwords.
  const preview = Object.keys(entry).map(key => ({ field: name + '.' + key,
    before: previous === undefined ? '(absent)' : '[existing value hidden]', after: entry[key] }));
  return { text: output, changed: true, replacing: previous !== undefined, preview };
}
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]));
  return value;
}
