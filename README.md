# Nixflex Node SDK and CLI — 0.11.0 candidate

Node 18+ for SDK/CLI, Node 22+ for MCP setup. SDK uses native fetch; CLI parser is bundled with its notices.

~~~js
import Nixflex from 'nixflex';
const client = new Nixflex({apiKey:process.env.NIXFLEX_API_KEY});
const agents = await client.agents.list({limit:1});
// Do not print private responses or credentials.
~~~

Install the approved release using npm install nixflex; local tests use the tarball. CLI: nixflex --help. Set NIXFLEX_API_KEY privately; --base-url explicitly selects staging. --json returns machine-readable results. New K1–K6 CLI writes need --confirm; older commands retain their documented behaviour.

## MCP setup

Automatic config writers: Claude Desktop and Cursor. Claude Code/Codex use shared builders/manual configuration; VS Code setup is retired. Test unpublished MCP with nixflex mcp setup claude|cursor --mcp-local DIRECTORY.

Normal npm-mode setup writes a launcher pinned to nixflex-mcp@0.5.0. Publish MCP and verify the registry version BEFORE publishing Node; this candidate does not publish or download anything during setup. No key goes into client config. Provide key and explicit API URL through the client's environment. Legacy credential files are plaintext, not an OS vault. OS-vault setup and human Windows/Mac validation remain separate work.

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

## Caller read: missing record versus wrong number

GET /v1/phone-numbers/:phoneNumber/callers/:callerNumber returns HTTP 404 with code caller_not_found when the owned number has no saved record for that caller. HTTP 404 phone_number_not_found means the business number is missing or is not owned by this account; do not treat it as an empty caller record. Generic not_found is not the documented caller-absence response.

Node and Python raise NixflexNotFoundError with status=404 and the exact server code. CLI --json exits 1 and preserves error.status and error.code (it does not serialize a JavaScript exception class). Inspect the code; never swallow all 404s. The K5b staging checker passes its synthetic-caller absence check only for 404 caller_not_found and selects that probe's business number from the authenticated account list, excluding the two protected staging numbers. With no eligible number it reports PENDING and sends no caller request. Never log the key, headers or raw response body.

## K6 additions

Four Google Calendar methods, private number credentials, SMS 409 handling and booking models. Read [NUMBER-FEATURES.md](NUMBER-FEATURES.md) for exact fields, safe errors and recovery. All earlier exclusions remain, except the two explicit K6 MCP additions noted there.
