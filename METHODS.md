# Node public method signatures

All signatures come from current public classes. Options include abort/timeout; GET-only bounded retries. New CLI writes require --confirm. SDK mutations require deliberate application authorization; Knowledge also requires an explicit operation key.
See KNOWLEDGE.md and TEAM-INTEGRATIONS.md for defaults, limits, errors and replacement/patch rules. No personal-session, signing-secret or private provider wrappers are exposed.

| Resource | Signature |
| --- | --- |
| client.agents | create(params: AgentCreateParams = {}, opts?: RequestOptions): Promise<Agent> |
| client.agents | list(params: AgentListParams = {}, opts?: RequestOptions): Promise<Agent[]> |
| client.agents | *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Agent> |
| client.agents | get(agentId: string, opts?: RequestOptions): Promise<Agent> |
| client.agents | update(agentId: string, params: AgentUpdateParams, opts?: RequestOptions): Promise<Agent> |
| client.agents | delete(agentId: string, opts?: RequestOptions): Promise<AgentDeleteResponse> |
| client.callers | get(phoneNumber: string, callerNumber: string, opts?: RequestOptions): Promise<CallerContextResponse> |
| client.callers | set(phoneNumber: string, callerNumber: string, params: CallerContextSetParams, opts?: RequestOptions): Promise<CallerContextResponse> |
| client.callers | delete(phoneNumber: string, callerNumber: string, opts?: RequestOptions): Promise<CallerContextDeleteResponse> |
| client.callers | import(phoneNumber: string, callers: CallerImportRow[], opts?: RequestOptions): Promise<CallerImportResponse> |
| client.calls | create(params: OutboundCallParams, opts?: RequestOptions): Promise<OutboundCallResponse> |
| client.calls | list(params: ListParams = {}, opts?: RequestOptions): Promise<Call[]> |
| client.calls | history(params: CallHistoryParams = {}, opts?: RequestOptions): Promise<CallHistoryPage> |
| client.calls | read(callId: string, opts?: RequestOptions): Promise<CallRead> |
| client.calls | recording(callId: string, opts?: RequestOptions): Promise<CallRecording> |
| client.calls | *iter(pageSize = 100, opts?: RequestOptions): AsyncGenerator<Call> |
| client.calls | get(callId: string, opts?: RequestOptions): Promise<Call> |
| client.calls | delete(callId: string, opts?: RequestOptions): Promise<CallDeleteResponse> |
| client.calls | deleteAll(opts?: RequestOptions): Promise<CallDeleteAllResponse> |
| client.campaigns | cancel(id: string, opts?: RequestOptions): Promise<C5.CampaignCancelResponse> |
| client.campaigns | consent(id: string, params: C5.CampaignConsentParams, opts?: RequestOptions): Promise<C5.CampaignConsentResponse> |
| client.campaigns | resume(id: string, opts?: RequestOptions): Promise<C5.CampaignResumeResponse> |
| client.campaigns | list(params: C5.CampaignListQuery = {}, opts?: RequestOptions): Promise<C5.CampaignListResponse> |
| client.campaigns | create(params: BatchCampaignParams, opts?: RequestOptions): Promise<BatchCreateResponse> |
| client.campaigns | launch(campaignId: string, opts?: RequestOptions): Promise<BatchLaunchResponse> |
| client.contacts | preview(params: C.ContactPreviewParams, opts?: RequestOptions): Promise<C.ContactPreviewResponse> |
| client.contacts | list(params: C.ContactListQuery = {}, opts?: RequestOptions): Promise<C.ContactListResponse> |
| client.contacts | add(params: C.ContactAddParams, opts?: RequestOptions): Promise<C.ContactAddResponse> |
| client.contacts | remove(params: C.ContactRemoveParams, opts?: RequestOptions): Promise<C.ContactRemoveResponse> |
| client.account | retention(opts?: RequestOptions): Promise<AccountRetention> |
| client.voices | list(params: VoiceListParams = {}, opts?: RequestOptions): Promise<VoiceListResponse> |
| client.voices | get(voiceKey: string, params: VoiceContext = {}, opts?: RequestOptions): Promise<Voice> |
| client.inbox | list(channel: 'sms' &#124; 'web', number: string, params: C.InboxListQuery = {}, opts?: RequestOptions): Promise<C.InboxListResponse> |
| client.inbox | thread(channel: 'sms' &#124; 'web', number: string, thread: string, params: C.InboxThreadQuery = {}, opts?: RequestOptions): Promise<C.InboxThreadResponse> |
| client.inbox | update(channel: 'sms' &#124; 'web', number: string, thread: string, params: C.InboxUpdateParams, opts?: RequestOptions): Promise<C.InboxUpdateResponse> |
| client.inbox | features(opts?: RequestOptions): Promise<C.InboxFeaturesResponse> |
| client.inbox | numbers(params: C.InboxNumbersQuery = {}, opts?: RequestOptions): Promise<C.InboxNumbersResponse> |
| client.inbox | retention(params: C.InboxRetentionQuery = {}, opts?: RequestOptions): Promise<C.InboxRetentionResponse> |
| client.integrations | get(provider: P, number: string, opts?: RequestOptions): Promise<IntegrationReads[P]> |
| client.integrations | set(provider: P, number: string, body: IntegrationSettings[P], opts?: RequestOptions): Promise<IntegrationReceipt> |
| client.integrations | delete(provider: IntegrationProvider, number: string, opts?: RequestOptions): Promise<IntegrationReceipt> |
| client.integrations | getAgentPrecall(agentId: string, opts?: RequestOptions): Promise<AgentPrecall> |
| client.integrations | setAgentPrecall(agentId: string, url: string, opts?: RequestOptions): Promise<IntegrationReceipt> |
| client.integrations | deleteAgentPrecall(agentId: string, opts?: RequestOptions): Promise<IntegrationReceipt> |
| client.integrations | listFunctions(number: string, opts?: RequestOptions): Promise<{ phone_number: string; functions: CustomFunctionView[] }> |
| client.integrations | createFunction(number: string, body: CustomFunctionInput, opts?: RequestOptions): Promise<FunctionReceipt> |
| client.integrations | updateFunction(number: string, id: string, body: Partial<CustomFunctionInput>, opts?: RequestOptions): Promise<FunctionReceipt> |
| client.integrations | deleteFunction(number: string, id: string, opts?: RequestOptions): Promise<FunctionReceipt> |
| client.knowledge | deleteScope(target: string, body: RevisionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | getScope(target: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | putScope(target: string, body: ScopeInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | measureSource(target: string, body: { text: string }, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | startSession(target: string, body: SessionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | getBase(kb: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | discardDraft(kb: string, id: string, body: { expected_draft_revision: number }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | getDraft(kb: string, id: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | updateDraft(kb: string, id: string, body: DraftEdit, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | acceptDraft(kb: string, id: string, body: DraftAcceptance, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | createExport(kb: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | overview(kb: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | updateSettings(kb: string, body: SettingsInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | listSources(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> |
| client.knowledge | addSource(kb: string, body: SourceInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | deleteSource(kb: string, id: string, body: SourceDeletion, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | renameSource(kb: string, id: string, body: { expected_revision: number; title: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | replaceSource(kb: string, id: string, body: SourceReplacement, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | refreshSources(kb: string, body: { source_ids: string[]; review?: boolean }, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | searchTopics(kb: string, body: { query: string }, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | listTopics(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> |
| client.knowledge | createTopic(kb: string, body: TopicInput, opts: KnowledgeWriteOptions): Promise<KnowledgeTopicResult> |
| client.knowledge | deleteTopic(kb: string, id: string, body: RevisionInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | getTopic(kb: string, id: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | updateTopic(kb: string, id: string, body: TopicInput, opts: KnowledgeWriteOptions): Promise<KnowledgeTopicResult> |
| client.knowledge | unanswered(kb: string, query: PageQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> |
| client.knowledge | discoverWebsite(kb: string, body: { url: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | importWebsite(kb: string, body: WebsiteInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | capabilities(opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | events(query: { cursor?: string } = {}, opts?: RequestOptions): Promise<KnowledgeObject[]> |
| client.knowledge | downloadExport(id: string, query: { format?: 'json' &#124; 'text' } = {}, opts?: RequestOptions): AsyncGenerator<Uint8Array> |
| client.knowledge | getJob(id: string, opts?: RequestOptions): Promise<KnowledgeJob> |
| client.knowledge | cancelJob(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | retryJob(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeJob> |
| client.knowledge | targets(query: TargetQuery = {}, opts?: RequestOptions): Promise<KnowledgePage> |
| client.knowledge | getSession(id: string, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | cancelSession(id: string, body: EmptyInput, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | ask(id: string, body: { text: string }, opts: KnowledgeWriteOptions): Promise<KnowledgeObject> |
| client.knowledge | usage(query: { kb?: string } = {}, opts?: RequestOptions): Promise<KnowledgeObject> |
| client.knowledge | keyterms(target: string, opts?: RequestOptions): Promise<KnowledgeKeyterms> |
| client.knowledge | uploadSource(kb: string, file: string, opts: KnowledgeUploadOptions): Promise<KnowledgeJob> |
| client.knowledge | replaceSourceFile(kb: string, id: string, file: string, opts: KnowledgeUploadOptions): Promise<KnowledgeJob> |
| client.knowledge | measureFile(target: string, file: string, opts: RequestOptions = {}): Promise<KnowledgeObject> |
| client.knowledge | waitJob(id: string, options: JobPollOptions = {}): Promise<KnowledgeJob> |
| client.organisation | get(opts?:RequestOptions): Promise<OrganisationContext> |
| client.organisation | members(opts?:RequestOptions): Promise<OrganisationMembers> |
| client.organisation | invite(email:string, role:'admin'&#124;'member'='member', opts?:RequestOptions): Promise<InvitationReceipt> |
| client.organisation | resend(inviteId:string, opts?:RequestOptions): Promise<InvitationReceipt> |
| client.organisation | revoke(inviteId:string, opts?:RequestOptions): Promise<{id:string;state:string}> |
| client.organisation | removeMember(userId:string, opts?:RequestOptions): Promise<MembershipReceipt> |
| client.organisation | setRole(userId:string, role:'admin'&#124;'member', opts?:RequestOptions): Promise<MembershipReceipt> |
| client.organisation | activity(params:ActivityFilters={}, opts?:RequestOptions): Promise<ActivityPage> |
| client.organisation | activityCsv(params:ActivityFilters={}, opts?:RequestOptions): AsyncGenerator<Uint8Array> |
| client.organisation | rename(name:string, opts?:RequestOptions): Promise<{name:string}> |
| client.organisation | claimInvite(email:string, opts?:RequestOptions): Promise<InvitationReceipt> |
| client.phoneNumbers | usage(phoneNumber: string, params: NumberUsageParams = {}, opts?: RequestOptions): Promise<NumberUsageResponse> |
| client.phoneNumbers | import(params: PhoneNumberImportParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }> |
| client.phoneNumbers | list(params: PhoneNumberListParams = {}, opts?: RequestOptions): Promise<PhoneNumberListResponse> |
| client.phoneNumbers | get(phoneNumber: string, opts?: RequestOptions): Promise<{ phone_number: PhoneNumberDetails }> |
| client.phoneNumbers | update(phoneNumber: string, params: PhoneNumberMoveParams, opts?: RequestOptions): Promise<PhoneNumberMoveResponse> |
| client.phoneNumbers | update(phoneNumber: string, params: PhoneNumberUpdateParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber }> |
| client.phoneNumbers | update(phoneNumber: string, params: PhoneNumberUpdateParams &#124; PhoneNumberMoveParams, opts?: RequestOptions): Promise<{ phone_number: PhoneNumber } &#124; PhoneNumberMoveResponse> |
| client.phoneNumbers | move(phoneNumber: string, agentId: string, opts?: RequestOptions): Promise<PhoneNumberMoveResponse> |
| client.phoneNumbers | delete(phoneNumber: string, opts?: RequestOptions): Promise<PhoneNumberDeleteResponse> |
| client.phoneNumbers | setWebCalls(phoneNumber: string, enabled: boolean, opts?: RequestOptions): Promise<WebCallsToggleResponse> |
| client.phoneNumbers | getWebCalls(phoneNumber: string, opts?: RequestOptions): Promise<WebCallsToggleResponse> |
| client.sms.campaigns | cancel(id: string, opts?: RequestOptions): Promise<C5.CampaignCancelResponse> |
| client.sms.campaigns | consent(id: string, params: C5.CampaignConsentParams, opts?: RequestOptions): Promise<C5.CampaignConsentResponse> |
| client.sms.campaigns | resume(id: string, opts?: RequestOptions): Promise<C5.CampaignResumeResponse> |
| client.sms.campaigns | update(id: string, params: C5.SmsCampaignUpdateParams, opts?: RequestOptions): Promise<C5.SmsCampaignUpdateResponse> |
| client.sms.campaigns | create(params: SmsCampaignCreateParams, opts?: RequestOptions): Promise<SmsCampaignCreateResponse> |
| client.sms.campaigns | launch(campaignId: string, opts?: RequestOptions): Promise<SmsCampaignLaunchResponse> |
| client.sms.campaigns | list(params: { status?: string; limit?: number; before?: string } = {}, opts?: RequestOptions): Promise<SmsCampaignListResponse> |
| client.sms.campaigns | get(campaignId: string, opts?: RequestOptions & SmsCampaignDetailParams): Promise<SmsCampaignDetail> |
| client.sms.campaigns | delete(campaignId: string, opts?: RequestOptions): Promise<SmsCampaignDeleteResponse> |
| client.sms | send(params: SmsSendParams, opts?: RequestOptions): Promise<SmsSendResponse> |
| client.keys | activity(params: KeyActivityParams = {}, opts?: RequestOptions): Promise<KeyActivity> |
| client.keys | rotate(opts?: RequestOptions): Promise<KeyRotateResponse> |
| client.usage | get(opts?: RequestOptions): Promise<Usage> |
| client.webhooks | verify(rawBody: string &#124; Buffer, signatureHeader: string &#124; null &#124; undefined, keySecret: string, options?: import('../webhook-verify.js').VerifyOptions): boolean |
| client.webhooks | set(phoneNumber: string, url: string, slot: 1 &#124; 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> |
| client.webhooks | get(phoneNumber: string, slot: 1 &#124; 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> |
| client.webhooks | delete(phoneNumber: string, slot: 1 &#124; 2 = 1, opts?: RequestOptions): Promise<WebhookConfigResponse> |
| client.webAgent | get(number: string, opts?: RequestOptions): Promise<C.WebAgentReadResponse> |
| client.webAgent | update(number: string, params: C.WebAgentUpdateParams, opts?: RequestOptions): Promise<C.WebAgentUpdateResponse> |
| Nixflex | static createKey({name?,email?}, baseUrl?) — unauthenticated; returns a new secret once. Store privately. |
| module | verifyWebhookSignature(rawBody, header, signingSecret, options?) — verify raw bytes before trusting a webhook. |

## K6 per-number additions

| HTTP operation (number is URL-encoded E.164) | Node / CLI command | Python sync + async | MCP |
| --- | --- | --- | --- |
| POST /v1/integrations/google-calendar/number/{number}/connect | integrations.connectGoogleCalendar / integrations connectGoogleCalendar | integrations.connect_google_calendar | connect_google_calendar |
| GET /v1/integrations/google-calendar/number/{number} | integrations.getGoogleCalendar / integrations getGoogleCalendar | integrations.get_google_calendar | get_google_calendar |
| DELETE /v1/integrations/google-calendar/number/{number} | integrations.disconnectGoogleCalendar / integrations disconnectGoogleCalendar | integrations.disconnect_google_calendar | disconnect_google_calendar |
| PATCH /v1/integrations/google-calendar/number/{number} | integrations.updateGoogleCalendarSettings / integrations updateGoogleCalendarSettings | integrations.update_google_calendar_settings | update_google_calendar_settings |
| POST /v1/phone-numbers/{number}/credentials | phoneNumbers.updateCredentials / numbers updateCredentials | phone_numbers.update_credentials | update_phone_number_credentials |

See NUMBER-FEATURES.md for exact input/output and errors.

## K7 call results and requests

| Operation | Node | CLI | Python sync / async | MCP |
| --- | --- | --- | --- | --- |
| GET /v1/calls/{call_id}/bookings | calls.bookings(id) | calls bookings ID | calls.bookings(id) | get_call_bookings |
| POST /v1/calls/outbound, optional UUID request_id | calls.create(params) | calls create --request-id UUID or --body @prepared.json | calls.create(..., request_id=uuid) | create_call, optional request_id / safe_retry / confirm |
| GET /v1/calls/outbound/requests/{request_id} | calls.outboundRequest(uuid) | calls outboundRequest UUID | calls.outbound_request(uuid) | get_outbound_call_request |
| Local preparation, no API request | calls.prepare(params), prepareOutboundCall(params) | calls prepare --output prepared.json | calls.prepare(**params), prepare_outbound_call(params) | create_call with safe_retry:true and no request_id |

The two GET routes are new coverage. POST already existed; request_id extends it. Preparation is local, not another API endpoint. MCP now registers 96 tools (94 prior plus two reads); only create_call gains optional inputs/guidance. Its old inputs and annotations, all other 93 contracts and all unrelated handlers are pinned to K6. Public-scope exclusions remain unchanged.

See CALL-REQUESTS.md for exact fields, typed errors, unchanged no-ID behavior and CLI/MCP confirmation rules.

## K9 B57 deletion

| client.campaigns | delete(id: string, opts?: RequestOptions): Promise<CampaignDeleteResponse> |

See [B57-DELETES.md](B57-DELETES.md) for the three receipts, queued 503, permissions, uncertainty and unchanged bulk guard.
