/** C5 wire contract. Server defaults apply only when a field is omitted. */
export type InboxListQuery = { "archived"?: boolean; "unread"?: boolean; "search"?: string; "since"?: string; "period"?: "all" | "today" | "7" | "30" | "90"; "limit"?: number; "offset"?: number; };
export type InboxListResponse = { "conversations": ({ "thread_key": string; "last_at": string | null; "msg_count": number; "unread_count": number; "archived": boolean; "visits": number; "visitor_name": string | null; "visitor_phone": string | null; "matched": boolean; "last_message": string | null; })[]; "total": number; "archived_new": number; "unread_total": number; };
export type InboxThreadQuery = { "limit"?: number; "before"?: string; "before_id"?: string; };
export type InboxThreadResponse = { "messages": ({ "id": string; "thread_key": string; "content": string | null; "created_at": string | null; "incoming": boolean; "inbox_version": number | null; "visit_id": string | null; "visitor_name": string | null; "visitor_phone": string | null; "visitor_fields"?: ({ [key: string]: unknown; })[] | null; "knowledge_given"?: { [key: string]: unknown; } | (unknown)[] | null; })[]; "read_version": string; "has_more": boolean; };
export type InboxUpdateParams = { "archived"?: boolean; "read_version"?: string; };
export type InboxUpdateResponse = { "ok": true; "archived": boolean; };
export type InboxFeaturesResponse = { "enabled": boolean; };
export type InboxNumbersQuery = { "offset"?: number; };
export type InboxNumbersResponse = { "numbers": ({ "phone_number": string; "agent_id": string | null; "source": string | null; "sms_prompt": string | null; "web_prompt": string | null; "sms_reply_enabled": boolean | null; "web_agent_enabled": boolean | null; "web_calls_enabled": boolean | null; })[]; "agents": ({ "agent_id": string; "name": string | null; })[]; "has_more": boolean; };
export type InboxRetentionQuery = { "number"?: string; };
export type InboxRetentionResponse = { "call_retention_days": number; "web_days": number | null; "web_expiry_confirmed": boolean; "applies_to": "new_messages_agent_policy"; "legacy_web_policy": "account_policy_at_creation_or_90_days"; "zero_days_means": "next_cleanup_after_reply"; "archive_changes_retention": false; "sms_days": 90; "sms_processing_enabled": boolean; "web_processing_enabled": boolean; };
