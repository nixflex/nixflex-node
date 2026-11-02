# K4 public kit coverage — 2 November 2026

Source: engine origin/staging 5e00fa58f808d5d90eafde1256778a3cb5895d64; C6 public OpenAPI. No engine/docs-repository edits.

| Kit | C6 operations | All public operations | Remaining absent |
| --- | --- | --- | --- |
| Node | 44/45 | 101/141 | 40 |
| CLI | 44/45 | 101/141 | 40 |
| Python sync + async | 44/45 | 101/141 | 40 |
| MCP | 26/45 | 76/141 | 65 |

MCP: 70 tools in one install. Operation count differs because one tool may cover two webhook slots. K4 scope approved; prior descriptors/permissions unchanged, only two approved URL-output handlers change.

Signing-secret retrieval is a private human action, excluded from ALL kits. Personal invitation acceptance, leave, ownership offer/acceptance, login/session and closure are dashboard only: they require a person’s own authenticated session. API keys have Owner authority; kits cannot impersonate a personal role.

MCP exceptions remain: **account signup is not offered to AI assistants because it returns a new secret**; **bulk deletion is not offered to AI assistants for safety**; campaign resume/consent and suppression removal can enable outreach. K4 credential-setting and disconnect tools are excluded as listed.

Limits: activity JSON 50/page, CSV from server 500-row chunks, UTC inclusive dates, retention clamped server-side; IDs/cursors stay strings. Integration PUT replaces configuration; function PATCH changes supplied fields. Custom functions at most 15; timeout 1000..45000, default 5000. No eager client defaults overwrite omitted fields.

Roles: API-key requests are Owner-level. Personal Members cannot manage team or integrations. Personal Admin has permitted settings/Member-management rights in the dashboard, but cannot manage Admins, rename organisation, access keys, transfer ownership or close the account. SDK errors preserve server refusals. A committed member change with live_disconnect_pending is not proof live media disconnected.

CLI omits credential URLs, headers and free-form integration config. SDKs do not log; returned wire data may contain private URLs, so callers must not log it. All NEW CLI/MCP writes require confirmation before any request. Writes never auto-retry. Existing MCP key-rotation behaviour is outside this integration scope.

Success writes are PENDING MANUAL TEST. No cloud/provider requests or settings writes were performed. K3 staging acceptance is not K4 live evidence.

## C6 operations

| ID | Operation | Node | CLI | Python | MCP |
| --- | --- | --- | --- | --- | --- |
| 12 | PUT /v1/integrations/calcom/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 13 | GET /v1/integrations/calcom/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_calcom |
| 14 | DELETE /v1/integrations/calcom/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 15 | PUT /v1/integrations/slack/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 16 | GET /v1/integrations/slack/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_slack |
| 17 | DELETE /v1/integrations/slack/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 18 | PUT /v1/integrations/zapier/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 19 | GET /v1/integrations/zapier/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_zapier |
| 20 | DELETE /v1/integrations/zapier/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 21 | PUT /v1/integrations/make/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 22 | GET /v1/integrations/make/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_make |
| 23 | DELETE /v1/integrations/make/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 24 | PUT /v1/integrations/gohighlevel/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 25 | GET /v1/integrations/gohighlevel/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_gohighlevel |
| 26 | DELETE /v1/integrations/gohighlevel/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 27 | PUT /v1/integrations/webhook/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_webhook |
| 28 | GET /v1/integrations/webhook/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_webhook |
| 29 | DELETE /v1/integrations/webhook/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | delete_webhook |
| 30 | PUT /v1/integrations/webhook2/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_webhook |
| 31 | GET /v1/integrations/webhook2/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_webhook |
| 36 | PUT /v1/integrations/web-calls/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_number_web_calls |
| 37 | GET /v1/integrations/web-calls/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_number_web_calls |
| 38 | DELETE /v1/integrations/web-calls/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 39 | DELETE /v1/integrations/webhook2/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | delete_webhook |
| 40 | PUT /v1/integrations/precall/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 41 | GET /v1/integrations/precall/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_number_precall |
| 42 | DELETE /v1/integrations/precall/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 43 | PUT /v1/integrations/precall/agent/:agentId | integrations.setAgentPrecall | integrations setAgentPrecall | integrations.set_agent_precall | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 44 | GET /v1/integrations/precall/agent/:agentId | integrations.getAgentPrecall | integrations getAgentPrecall | integrations.get_agent_precall | get_agent_precall |
| 45 | DELETE /v1/integrations/precall/agent/:agentId | integrations.deleteAgentPrecall | integrations deleteAgentPrecall | integrations.delete_agent_precall | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 46 | POST /v1/integrations/custom-functions/number/:phoneNumber | integrations.createFunction | integrations createFunction | integrations.create_function | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 47 | GET /v1/integrations/custom-functions/number/:phoneNumber | integrations.listFunctions | integrations listFunctions | integrations.list_functions | list_custom_functions |
| 48 | DELETE /v1/integrations/custom-functions/number/:phoneNumber/:id | integrations.deleteFunction | integrations deleteFunction | integrations.delete_function | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 49 | PATCH /v1/integrations/custom-functions/number/:phoneNumber/:id | integrations.updateFunction | integrations updateFunction | integrations.update_function | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 143 | GET /v1/organisation | organisation.get | organisation get | organisation.get | get_organisation |
| 145 | GET /v1/organisation/activity | organisation.activity | organisation activity | organisation.activity | list_organisation_activity_filtered |
| 146 | POST /v1/organisation/claim-invite | organisation.claimInvite | organisation claimInvite | organisation.claim_invite | claim_organisation_owner |
| 148 | POST /v1/organisation/invites | organisation.invite | organisation invite | organisation.invite | invite_organisation_member |
| 149 | DELETE /v1/organisation/invites/:id | organisation.revoke | organisation revoke | organisation.revoke | revoke_organisation_invite |
| 150 | POST /v1/organisation/invites/:id/resend | organisation.resend | organisation resend | organisation.resend | resend_organisation_invite |
| 152 | GET /v1/organisation/members | organisation.members | organisation members | organisation.members | list_organisation_members |
| 153 | DELETE /v1/organisation/members/:id | organisation.removeMember | organisation removeMember | organisation.remove_member | remove_organisation_member |
| 154 | PATCH /v1/organisation/members/:id | organisation.setRole | organisation setRole | organisation.set_role | update_organisation_member_role |
| 155 | PATCH /v1/organisation/name | organisation.rename | organisation rename | organisation.rename | rename_organisation |
| 158 | GET /v1/organisation/signing-secret | EXCLUDED: private human action | EXCLUDED: private human action | EXCLUDED: private human action | EXCLUDED: private human action |

## All 141 public operations

| ID | Operation | Node | CLI | Python | MCP |
| --- | --- | --- | --- | --- | --- |
| 52 | `GET /v1/agent-inbox/:channel/:number` | inbox.list | inbox list | inbox.list | list_inbox_conversations |
| 53 | `GET /v1/agent-inbox/:channel/:number/thread/:thread` | inbox.thread | inbox thread | inbox.thread | get_inbox_thread |
| 54 | `PATCH /v1/agent-inbox/:channel/:number/thread/:thread` | inbox.update | inbox update | inbox.update | update_inbox_thread |
| 55 | `GET /v1/agent-inbox/features` | inbox.features | inbox features | inbox.features | get_inbox_features |
| 56 | `GET /v1/agent-inbox/numbers` | inbox.numbers | inbox numbers | inbox.numbers | list_inbox_numbers |
| 57 | `GET /v1/agent-inbox/retention` | inbox.retention | inbox retention | inbox.retention | get_inbox_retention |
| 58 | `GET /v1/agent-web/:number` | webAgent.get | web-agent get | web_agent.get | get_web_agent |
| 59 | `PATCH /v1/agent-web/:number` | webAgent.update | web-agent update | web_agent.update | update_web_agent |
| 90 | `POST /v1/calls/batch` | campaigns.create | campaigns create | campaigns.create | create_campaign |
| 91 | `POST /v1/calls/batch/:id/cancel` | campaigns.cancel | campaigns cancel | campaigns.cancel | cancel_campaign |
| 92 | `POST /v1/calls/batch/:id/consent` | campaigns.consent | campaigns consent | campaigns.consent | EXCLUDED: Consent can unblock scheduled outreach. |
| 93 | `POST /v1/calls/batch/:id/launch` | campaigns.launch | campaigns launch | campaigns.launch | launch_campaign |
| 94 | `POST /v1/calls/batch/:id/resume` | campaigns.resume | campaigns resume | campaigns.resume | EXCLUDED: Resume can start real calls to many people. |
| 97 | `GET /v1/campaigns` | campaigns.list | campaigns list | campaigns.list | list_campaigns |
| 98 | `POST /v1/contact-hours/preview` | contacts.preview | contacts preview | contacts.preview | preview_contact_hours |
| 99 | `DELETE /v1/contact-suppressions` | contacts.remove | contacts remove | contacts.remove | EXCLUDED: Suppression removal can make scheduled outreach eligible again. |
| 100 | `GET /v1/contact-suppressions` | contacts.list | contacts list | contacts.list | list_contact_suppressions |
| 101 | `POST /v1/contact-suppressions` | contacts.add | contacts add | contacts.add | add_contact_suppressions |
| 175 | `GET /v1/sms/campaigns` | sms.campaigns.list | sms campaigns list | sms.campaigns.list | list_sms_campaigns |
| 176 | `POST /v1/sms/campaigns` | sms.campaigns.create | sms campaigns create | sms.campaigns.create | create_sms_campaign |
| 177 | `DELETE /v1/sms/campaigns/:id` | sms.campaigns.delete | sms campaigns delete | sms.campaigns.delete | delete_sms_campaign |
| 178 | `GET /v1/sms/campaigns/:id` | sms.campaigns.get | sms campaigns get | sms.campaigns.get | get_sms_campaign |
| 179 | `PATCH /v1/sms/campaigns/:id` | sms.campaigns.update | sms campaigns update | sms.campaigns.update | update_sms_campaign |
| 180 | `POST /v1/sms/campaigns/:id/cancel` | sms.campaigns.cancel | sms campaigns cancel | sms.campaigns.cancel | cancel_sms_campaign |
| 181 | `POST /v1/sms/campaigns/:id/consent` | sms.campaigns.consent | sms campaigns consent | sms.campaigns.consent | EXCLUDED: Consent can unblock scheduled outreach. |
| 182 | `POST /v1/sms/campaigns/:id/launch` | sms.campaigns.launch | sms campaigns launch | sms.campaigns.launch | launch_sms_campaign |
| 183 | `POST /v1/sms/campaigns/:id/resume` | sms.campaigns.resume | sms campaigns resume | sms.campaigns.resume | EXCLUDED: Resume can send real texts to many people. |
| 1 | `POST /v1/keys` | Nixflex.createKey | keys create | Nixflex.create_key / AsyncNixflex.create_key | EXCLUDED: account signup is not offered to AI assistants because it returns a new secret |
| 2 | `POST /v1/keys/rotate` | keys.rotate | keys rotate | keys.rotate | rotate_api_key |
| 51 | `GET /v1/account/retention` | account.retention | account retention | account.retention | get_account_retention |
| 60 | `GET /v1/agents` | agents.list | agents list | agents.list | list_agents |
| 61 | `POST /v1/agents` | agents.create | agents create | agents.create | create_agent |
| 62 | `DELETE /v1/agents/:id` | agents.delete | agents delete | agents.delete | delete_agent |
| 63 | `GET /v1/agents/:id` | agents.get | agents get | agents.get | get_agent |
| 64 | `PUT /v1/agents/:id` | agents.update | agents update | agents.update | update_agent |
| 83 | `DELETE /v1/calls` | calls.deleteAll | calls delete-all | calls.delete_all | EXCLUDED: bulk deletion is not offered to AI assistants for safety |
| 84 | `GET /v1/calls` | calls.list | calls list | calls.list | list_calls |
| 86 | `DELETE /v1/calls/:id` | calls.delete | calls delete | calls.delete | delete_call |
| 87 | `GET /v1/calls/:id` | calls.get/read | calls get/read | calls.get/read | get_call |
| 89 | `GET /v1/calls/:id/recording` | calls.recording | calls recording | calls.recording | get_call view:recording |
| 95 | `GET /v1/calls/history` | calls.history | calls history | calls.history | list_calls history:true |
| 96 | `POST /v1/calls/outbound` | calls.create | calls create | calls.create | create_call |
| 102 | `GET /v1/keys/activity` | keys.activity | keys activity | keys.activity | get_key_activity |
| 164 | `GET /v1/phone-numbers` | phoneNumbers.list | numbers list | phone_numbers.list | list_phone_numbers |
| 165 | `POST /v1/phone-numbers` | phoneNumbers.import | numbers import | phone_numbers.import_ | import_phone_number |
| 166 | `DELETE /v1/phone-numbers/:phoneNumber` | phoneNumbers.delete | numbers delete | phone_numbers.delete | delete_phone_number |
| 167 | `GET /v1/phone-numbers/:phoneNumber` | phoneNumbers.get | numbers get | phone_numbers.get | list_phone_numbers phone_number |
| 168 | `PATCH /v1/phone-numbers/:phoneNumber` | phoneNumbers.update/move | numbers update/move | phone_numbers.update/move | update_phone_number |
| 169 | `DELETE /v1/phone-numbers/:phoneNumber/callers/:callerNumber` | callers.delete | callers delete | callers.delete | delete_caller_context |
| 170 | `GET /v1/phone-numbers/:phoneNumber/callers/:callerNumber` | callers.get | callers get | callers.get | get_caller_context |
| 171 | `PUT /v1/phone-numbers/:phoneNumber/callers/:callerNumber` | callers.set | callers set | callers.set | set_caller_context |
| 172 | `POST /v1/phone-numbers/:phoneNumber/callers/import` | callers.import | callers import | callers.import_ | import_caller_context |
| 173 | `GET /v1/phone-numbers/:phoneNumber/usage` | phoneNumbers.usage | numbers usage | phone_numbers.usage | list_phone_numbers usage |
| 174 | `POST /v1/sms` | sms.send | sms send | sms.send | send_sms |
| 186 | `GET /v1/usage` | usage.get | usage | usage.get | get_usage |
| 187 | `GET /v1/voices` | voices.list | voices list | voices.list | list_voices |
| 188 | `GET /v1/voices/:voice_key` | voices.get | voices get | voices.get | get_voice |
| 12 | PUT /v1/integrations/calcom/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 13 | GET /v1/integrations/calcom/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_calcom |
| 14 | DELETE /v1/integrations/calcom/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 15 | PUT /v1/integrations/slack/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 16 | GET /v1/integrations/slack/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_slack |
| 17 | DELETE /v1/integrations/slack/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 18 | PUT /v1/integrations/zapier/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 19 | GET /v1/integrations/zapier/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_zapier |
| 20 | DELETE /v1/integrations/zapier/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 21 | PUT /v1/integrations/make/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 22 | GET /v1/integrations/make/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_make |
| 23 | DELETE /v1/integrations/make/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 24 | PUT /v1/integrations/gohighlevel/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 25 | GET /v1/integrations/gohighlevel/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_gohighlevel |
| 26 | DELETE /v1/integrations/gohighlevel/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 27 | PUT /v1/integrations/webhook/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_webhook |
| 28 | GET /v1/integrations/webhook/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_webhook |
| 29 | DELETE /v1/integrations/webhook/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | delete_webhook |
| 30 | PUT /v1/integrations/webhook2/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_webhook |
| 31 | GET /v1/integrations/webhook2/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_webhook |
| 36 | PUT /v1/integrations/web-calls/number/:phoneNumber | integrations.set | integrations set | integrations.set | set_number_web_calls |
| 37 | GET /v1/integrations/web-calls/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_number_web_calls |
| 38 | DELETE /v1/integrations/web-calls/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 39 | DELETE /v1/integrations/webhook2/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | delete_webhook |
| 40 | PUT /v1/integrations/precall/number/:phoneNumber | integrations.set | integrations set | integrations.set | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 41 | GET /v1/integrations/precall/number/:phoneNumber | integrations.get | integrations get | integrations.get | get_number_precall |
| 42 | DELETE /v1/integrations/precall/number/:phoneNumber | integrations.delete | integrations delete | integrations.delete | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 43 | PUT /v1/integrations/precall/agent/:agentId | integrations.setAgentPrecall | integrations setAgentPrecall | integrations.set_agent_precall | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 44 | GET /v1/integrations/precall/agent/:agentId | integrations.getAgentPrecall | integrations getAgentPrecall | integrations.get_agent_precall | get_agent_precall |
| 45 | DELETE /v1/integrations/precall/agent/:agentId | integrations.deleteAgentPrecall | integrations deleteAgentPrecall | integrations.delete_agent_precall | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 46 | POST /v1/integrations/custom-functions/number/:phoneNumber | integrations.createFunction | integrations createFunction | integrations.create_function | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 47 | GET /v1/integrations/custom-functions/number/:phoneNumber | integrations.listFunctions | integrations listFunctions | integrations.list_functions | list_custom_functions |
| 48 | DELETE /v1/integrations/custom-functions/number/:phoneNumber/:id | integrations.deleteFunction | integrations deleteFunction | integrations.delete_function | EXCLUDED: Disconnects or removes an integration/default used by calls: intentional MCP exception; API/SDK/CLI available. |
| 49 | PATCH /v1/integrations/custom-functions/number/:phoneNumber/:id | integrations.updateFunction | integrations updateFunction | integrations.update_function | EXCLUDED: Private credentials/URLs or executable configuration: API/SDK/CLI only; avoid putting secrets in an AI conversation. |
| 65 | `DELETE /v1/agents/:target/knowledge-base` | — | — | — | — |
| 66 | `GET /v1/agents/:target/knowledge-base` | — | — | — | — |
| 67 | `PUT /v1/agents/:target/knowledge-base` | — | — | — | — |
| 69 | `POST /v1/agents/:target/knowledge-base/source-measure` | — | — | — | — |
| 70 | `POST /v1/agents/:target/knowledge-base/test-sessions` | — | — | — | — |
| 103 | `GET /v1/knowledge-bases/:kb` | — | — | — | — |
| 104 | `DELETE /v1/knowledge-bases/:kb/drafts/:id` | — | — | — | — |
| 105 | `GET /v1/knowledge-bases/:kb/drafts/:id` | — | — | — | — |
| 106 | `PATCH /v1/knowledge-bases/:kb/drafts/:id` | — | — | — | — |
| 107 | `POST /v1/knowledge-bases/:kb/drafts/:id/accept` | — | — | — | — |
| 108 | `POST /v1/knowledge-bases/:kb/exports` | — | — | — | — |
| 109 | `GET /v1/knowledge-bases/:kb/overview` | — | — | — | — |
| 110 | `PATCH /v1/knowledge-bases/:kb/settings` | — | — | — | — |
| 111 | `GET /v1/knowledge-bases/:kb/sources` | — | — | — | — |
| 112 | `POST /v1/knowledge-bases/:kb/sources` | — | — | — | — |
| 113 | `DELETE /v1/knowledge-bases/:kb/sources/:id` | — | — | — | — |
| 114 | `PATCH /v1/knowledge-bases/:kb/sources/:id` | — | — | — | — |
| 115 | `POST /v1/knowledge-bases/:kb/sources/:id/replacements` | — | — | — | — |
| 116 | `POST /v1/knowledge-bases/:kb/sources/refresh` | — | — | — | — |
| 117 | `POST /v1/knowledge-bases/:kb/topic-search` | — | — | — | — |
| 118 | `GET /v1/knowledge-bases/:kb/topics` | — | — | — | — |
| 119 | `POST /v1/knowledge-bases/:kb/topics` | — | — | — | — |
| 120 | `DELETE /v1/knowledge-bases/:kb/topics/:id` | — | — | — | — |
| 121 | `GET /v1/knowledge-bases/:kb/topics/:id` | — | — | — | — |
| 122 | `PATCH /v1/knowledge-bases/:kb/topics/:id` | — | — | — | — |
| 123 | `GET /v1/knowledge-bases/:kb/unanswered` | — | — | — | — |
| 124 | `POST /v1/knowledge-bases/:kb/website-discoveries` | — | — | — | — |
| 125 | `POST /v1/knowledge-bases/:kb/website-imports` | — | — | — | — |
| 126 | `GET /v1/knowledge/capabilities` | — | — | — | — |
| 127 | `GET /v1/knowledge/events` | — | — | — | — |
| 128 | `GET /v1/knowledge/exports/:id` | — | — | — | — |
| 129 | `GET /v1/knowledge/jobs/:id` | — | — | — | — |
| 130 | `POST /v1/knowledge/jobs/:id/cancel` | — | — | — | — |
| 131 | `POST /v1/knowledge/jobs/:id/retry` | — | — | — | — |
| 132 | `GET /v1/knowledge/targets` | — | — | — | — |
| 133 | `GET /v1/knowledge/test-sessions/:id` | — | — | — | — |
| 134 | `POST /v1/knowledge/test-sessions/:id/cancel` | — | — | — | — |
| 135 | `POST /v1/knowledge/test-sessions/:id/messages` | — | — | — | — |
| 136 | `GET /v1/knowledge/usage` | — | — | — | — |
| 143 | GET /v1/organisation | organisation.get | organisation get | organisation.get | get_organisation |
| 145 | GET /v1/organisation/activity | organisation.activity | organisation activity | organisation.activity | list_organisation_activity_filtered |
| 146 | POST /v1/organisation/claim-invite | organisation.claimInvite | organisation claimInvite | organisation.claim_invite | claim_organisation_owner |
| 148 | POST /v1/organisation/invites | organisation.invite | organisation invite | organisation.invite | invite_organisation_member |
| 149 | DELETE /v1/organisation/invites/:id | organisation.revoke | organisation revoke | organisation.revoke | revoke_organisation_invite |
| 150 | POST /v1/organisation/invites/:id/resend | organisation.resend | organisation resend | organisation.resend | resend_organisation_invite |
| 152 | GET /v1/organisation/members | organisation.members | organisation members | organisation.members | list_organisation_members |
| 153 | DELETE /v1/organisation/members/:id | organisation.removeMember | organisation removeMember | organisation.remove_member | remove_organisation_member |
| 154 | PATCH /v1/organisation/members/:id | organisation.setRole | organisation setRole | organisation.set_role | update_organisation_member_role |
| 155 | PATCH /v1/organisation/name | organisation.rename | organisation rename | organisation.rename | rename_organisation |
| 158 | GET /v1/organisation/signing-secret | EXCLUDED: private human action | EXCLUDED: private human action | EXCLUDED: private human action | EXCLUDED: private human action |
| 191 | `GET /v1/agents/:target/knowledge-base/test-options` | RETIRED B49b | RETIRED B49b | RETIRED B49b | RETIRED B49b |
