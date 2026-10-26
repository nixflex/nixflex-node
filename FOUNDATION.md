# MCP install run 1 — Node/CLI hand-off

26 October 2026; feature branch `codex/mcp-install-foundation-node`.
Candidate CLI 0.9.1, not published. SDK transport and API methods are unchanged.

`src/cli/mcp/` contains focused helpers, each under 300 lines. Only MCP hand-off,
help and `--mcp-local` parsing changed in the legacy CLI entry point. Its later
full split remains a separate future task, with its own tests and save point.

Shared connection/origin/launch modules match the MCP repo byte-for-byte. The
MCP version pin is 0.3.1 and `published:false`. Never enable registry setup until
the exact tested version is actually published. No npm publish occurred here.

`mcp setup claude|cursor --mcp-local <verified-package-directory>` exercises the new
safe writer against a local artifact. Codex/Claude Code builders exist, but those
end-user installation flows remain run 3. VS Code setup refuses explicitly.

The JSONC parser 3.3.1 is a pinned build dependency bundled into the CLI; its licence
is in THIRD-PARTY-NOTICES.md. The SDK library keeps zero runtime dependencies.
The setup writer preserves unrelated bytes/comments, redacts all old values,
requires approval to replace a different entry, and uses private atomic writes.
Windows temp files receive explicit owner/SYSTEM ACLs before content is written;
POSIX uses mode 0600. Corrupt, duplicate, read-only, linked and concurrently changed
targets fail without replacing the original. Another installer's lock is never removed.
An existing commented Nixflex block that needs changing is refused for manual review.
Close other editors: portable atomic replacement is not a universal CAS against
noncooperating writers after the final verification.

No legacy credential files were read or changed in this run. Tests use sentinel
fixtures only. No real key is written into generated client configuration. Legacy
login remains plaintext; OS-vault setup is explicitly deferred to run 3.

Run `npm run build` then `npm run check`. Added tests cover real built CLI local
setup, unpublished/VS Code/missing-URL refusal, JSONC preservation, confirmation,
sentinel redaction, private permissions and concurrent/invalid-file refusal.
Every pre-existing assertion and test remains unchanged in this repository.
Windows/macOS/Linux Node 22/24 workflow is added; remote runs are pending push.

The full report, fixture-change ledger, smoke command and measured packed-server
evidence live in the MCP repo's FOUNDATION.md and EVIDENCE.json. Windows human test:
run `scripts/staging-check.ps1` from that repo after `npm run check:packed`, approve
only the staging `get_usage` read, then stop. No real call/SMS/payment is required.
