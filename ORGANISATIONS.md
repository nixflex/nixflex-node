# Organisations candidate — not published or ready to enable

Engine SQL 104 and reviewed round 2 activation are required. Read `client.organisation.get()`, `.members()` and `.activity({before,actor})`. Manage `.invite(email,role)`, `.resend(inviteId)`, `.revoke(inviteId)`, `.removeMember(userId)`, `.setRole(userId,role)` and API-only `.claimInvite(email)`.

These use the existing organisation API key and its Owner-level API authority. Removing a dashboard member does not invalidate an externally shared key; the Owner must roll that key separately. No new key is created. No personal acceptance, Leave, ownership transfer or account deletion is exposed through this resource. No automatic signing-secret disclosure.

CLI: `nixflex organisation get`, `members`, `activity`; changes `invite`, `claim`, `resend ID`, `revoke ID`, `remove USER_ID`, `role USER_ID`. Use `--set email=person@example.com`, `--set role=member` (or admin), Activity `--set before=123 --set actor=UUID`. Review the default preview, then add `--confirm` to make a change. Never blindly repeat after an unknown response.

The current SDK fixed-resource CLI coverage test has no Organisation mapping. It remains unchanged and fails deliberately until an additive test-map extension is approved. New behavioural tests prove each implemented route and preview. Do not publish this candidate while any full gate fails.
