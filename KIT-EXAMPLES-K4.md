# K4 exact examples — 2 November 2026

Candidates: Node/CLI 0.10.0, Python 0.3.0, MCP 0.4.0. Private local artifacts only.
Examples use reserved numbers, example.invalid and fixture values, never real credentials. Use private environment variables for the account key; private JSON files for settings. Never paste credentials into shell commands, reports or AI conversations. Never print SDK integration responses.
Node: new Nixflex({apiKey: process.env.NIXFLEX_API_KEY}). Python: Nixflex(api_key=os.environ["NIXFLEX_API_KEY"]); AsyncNixflex uses await for JSON methods and async for for CSV. CLI reads NIXFLEX_API_KEY.
Examples preserve false/zero/null; server supplies defaults when omitted. Empty function lists and no-op deletes do not prove ownership.
For safe staging checks use K4-TEST.ps1: 15 GET/read-refusal checks per kit, no mutations. Successful writes below remain pending manual test.

| C6 operation | Examples |
| --- | --- |
| 12 PUT /v1/integrations/calcom/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/12.md) |
| 13 GET /v1/integrations/calcom/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/13.md) |
| 14 DELETE /v1/integrations/calcom/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/14.md) |
| 15 PUT /v1/integrations/slack/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/15.md) |
| 16 GET /v1/integrations/slack/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/16.md) |
| 17 DELETE /v1/integrations/slack/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/17.md) |
| 18 PUT /v1/integrations/zapier/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/18.md) |
| 19 GET /v1/integrations/zapier/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/19.md) |
| 20 DELETE /v1/integrations/zapier/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/20.md) |
| 21 PUT /v1/integrations/make/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/21.md) |
| 22 GET /v1/integrations/make/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/22.md) |
| 23 DELETE /v1/integrations/make/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/23.md) |
| 24 PUT /v1/integrations/gohighlevel/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/24.md) |
| 25 GET /v1/integrations/gohighlevel/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/25.md) |
| 26 DELETE /v1/integrations/gohighlevel/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/26.md) |
| 27 PUT /v1/integrations/webhook/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/27.md) |
| 28 GET /v1/integrations/webhook/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/28.md) |
| 29 DELETE /v1/integrations/webhook/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/29.md) |
| 30 PUT /v1/integrations/webhook2/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/30.md) |
| 31 GET /v1/integrations/webhook2/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/31.md) |
| 36 PUT /v1/integrations/web-calls/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/36.md) |
| 37 GET /v1/integrations/web-calls/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/37.md) |
| 38 DELETE /v1/integrations/web-calls/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/38.md) |
| 39 DELETE /v1/integrations/webhook2/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/39.md) |
| 40 PUT /v1/integrations/precall/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/40.md) |
| 41 GET /v1/integrations/precall/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/41.md) |
| 42 DELETE /v1/integrations/precall/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/42.md) |
| 43 PUT /v1/integrations/precall/agent/:agentId | [Node / CLI / Python / MCP](examples-k4/43.md) |
| 44 GET /v1/integrations/precall/agent/:agentId | [Node / CLI / Python / MCP](examples-k4/44.md) |
| 45 DELETE /v1/integrations/precall/agent/:agentId | [Node / CLI / Python / MCP](examples-k4/45.md) |
| 46 POST /v1/integrations/custom-functions/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/46.md) |
| 47 GET /v1/integrations/custom-functions/number/:phoneNumber | [Node / CLI / Python / MCP](examples-k4/47.md) |
| 48 DELETE /v1/integrations/custom-functions/number/:phoneNumber/:id | [Node / CLI / Python / MCP](examples-k4/48.md) |
| 49 PATCH /v1/integrations/custom-functions/number/:phoneNumber/:id | [Node / CLI / Python / MCP](examples-k4/49.md) |
| 143 GET /v1/organisation | [Node / CLI / Python / MCP](examples-k4/143.md) |
| 145 GET /v1/organisation/activity | [Node / CLI / Python / MCP](examples-k4/145.md) |
| 146 POST /v1/organisation/claim-invite | [Node / CLI / Python / MCP](examples-k4/146.md) |
| 148 POST /v1/organisation/invites | [Node / CLI / Python / MCP](examples-k4/148.md) |
| 149 DELETE /v1/organisation/invites/:id | [Node / CLI / Python / MCP](examples-k4/149.md) |
| 150 POST /v1/organisation/invites/:id/resend | [Node / CLI / Python / MCP](examples-k4/150.md) |
| 152 GET /v1/organisation/members | [Node / CLI / Python / MCP](examples-k4/152.md) |
| 153 DELETE /v1/organisation/members/:id | [Node / CLI / Python / MCP](examples-k4/153.md) |
| 154 PATCH /v1/organisation/members/:id | [Node / CLI / Python / MCP](examples-k4/154.md) |
| 155 PATCH /v1/organisation/name | [Node / CLI / Python / MCP](examples-k4/155.md) |
| 158 GET /v1/organisation/signing-secret | [Node / CLI / Python / MCP](examples-k4/158.md) |
