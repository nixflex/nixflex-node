# Nixflex Node SDK and CLI — 0.10.0 candidate

Node 18+ for SDK/CLI, Node 22+ for MCP setup. SDK uses native fetch; CLI parser is bundled with its notices.

~~~js
import Nixflex from 'nixflex';
const client = new Nixflex({apiKey:process.env.NIXFLEX_API_KEY});
const agents = await client.agents.list({limit:1});
// Do not print private responses or credentials.
~~~

Install the approved release using npm install nixflex; local tests use the tarball. CLI: nixflex --help. Set NIXFLEX_API_KEY privately; --base-url explicitly selects staging. --json returns machine-readable results. New K1–K5 CLI writes need --confirm; older commands retain their documented behaviour.

## MCP setup

Automatic config writers: Claude Desktop and Cursor. Claude Code/Codex use shared builders/manual configuration; VS Code setup is retired. Test unpublished MCP with nixflex mcp setup claude|cursor --mcp-local DIRECTORY.

Normal npm-mode setup stays blocked pending publication approval. No key goes into client config. Provide key and explicit API URL through the client's environment. Legacy credential files are plaintext, not an OS vault. OS-vault setup and human Windows/Mac validation remain separate work.

Malformed/unreadable config is refused; unrelated entries/comments survive. Replacement needs confirmation. Avoid concurrent config editors/installers.

## Contract and safety

K1–K5 cover 140 of 141 public inventory operations in Node/CLI/Python. Private signing-secret retrieval is deliberately excluded. Dedicated Knowledge keyterms is additional to the old denominator. Personal login, invite acceptance, ownership transfer and account closure remain dashboard-only.

Only GET has bounded retries (default one). POST/PUT/PATCH/DELETE never automatically repeat, including 429, lost replies or malformed success. NixflexOutcomeUnknownError means outcome unknown and safe_to_retry false: inspect authoritative state before retrying. Never log raw errors, customer content, recordings, credentials or private integration responses.

Ownership, roles, active-state, busy work, unsettled charges, revisions and cleanup refusals remain authoritative. Accepted deletion is not proof cleanup finished. API keys act with Owner authority and cannot impersonate a personal member session.

Omitted fields stay omitted. Agent defaults are dynamic greeting true, maximum duration 300 seconds, silence hangup 10 seconds; existing agents are not rewritten. Single-call variables use dynamic_vars; variables is a non-conflicting alias. Campaign recipient variables stay unchanged. SMS requires a sender; campaign message_template and scheduled_date are canonical.

Preserve page filters/string cursors; stop at next_cursor:null. Call iterators use pages 1–200; offset paging is not a snapshot. Integration PUT replaces configuration; custom-function PATCH changes supplied fields.

Webhook verification uses the organisation signing secret, independent of key rotation. Obtain it privately outside kits; verify the raw body before trusting a delivery.

## Method reference

See [METHODS.md](METHODS.md), [KNOWLEDGE.md](KNOWLEDGE.md), [TEAM-INTEGRATIONS.md](TEAM-INTEGRATIONS.md), [ORGANISATIONS.md](ORGANISATIONS.md) and [CHANGELOG.md](CHANGELOG.md). Full API reference: https://docs.nixflex.com.

Unpublished candidates. Offline coverage does not prove successful mutations on staging; those tests remain manual.
