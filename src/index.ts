// ============================================
// src/index.ts
// The Nixflex SDK entry point.
//
//   import Nixflex from 'nixflex';
//   const client = new Nixflex({ apiKey: 'nxf_xxx:nxfs_xxx' });
//   const call = await client.calls.create({ agent_id, to_number, prompt });
//
// Surface: agents, calls, campaigns (voice batch), phoneNumbers, sms
// (+ sms.campaigns), keys, usage, webhooks (per-number config), storage, llm,
// tts, callers (caller context).
// The docs (docs.nixflex.com) are the single source of truth - when the API
// changes, the docs change, and this SDK changes in the same session.
// ============================================
import { HttpClient, type NixflexClientOptions, type RequestOptions } from './client.js';
import { Agents } from './resources/agents.js';
import { Calls, Campaigns } from './resources/calls.js';
import { PhoneNumbers, Sms, Keys, UsageResource, Webhooks } from './resources/stage3.js';
import { Callers } from './resources/callers.js';
import type { KeyCreateResponse } from './types/account.js';
import { createKey } from './key-create.js';
import { Integrations } from './resources/integrations.js';
export * from './types/integrations.js';
import { Organisation } from './resources/organisation.js';
import { Account, Voices } from './resources/core.js';
export * from './types/core.js';
export * from './resources/organisation.js';
export type { PhoneNumberMoveParams, PhoneNumberMoveResponse } from './resources/number-move.js';

import { Contacts } from './resources/contacts.js';
export * from './types/contacts.js';
import { WebAgent } from './resources/web-agent.js';
export * from './types/web-agent.js';
import { Inbox } from './resources/inbox.js';
export * from './types/inbox.js';
export class Nixflex {
  readonly inbox: Inbox;
  readonly webAgent: WebAgent;
  readonly contacts: Contacts;
  readonly account: Account;
  readonly voices: Voices;
  readonly organisation: Organisation;
  readonly integrations: Integrations;
  /** AI agents - create, list, get, update, delete. */
  readonly agents: Agents;
  /** Calls - trigger outbound, list history, fetch transcripts + analysis. */
  readonly calls: Calls;
  /** Voice batch campaigns - many calls under one campaign, scheduling windows. */
  readonly campaigns: Campaigns;
  /** Phone numbers - import (Twilio/Telnyx), settings, monitor + web-calls toggles. */
  readonly phoneNumbers: PhoneNumbers;
  /** SMS - single sends + bulk campaigns. */
  readonly sms: Sms;
  /** API key management - rotate the secret. */
  readonly keys: Keys;
  /** Usage + balance. */
  readonly usage: UsageResource;
  /** Per-number post-call webhook configuration. */
  readonly webhooks: Webhooks;
  /** Caller context - what the agent knows about each caller on one of your numbers. */
  readonly callers: Callers;

  constructor(options: NixflexClientOptions) {
    const http = new HttpClient(options);
    this.inbox = new Inbox(http);
    this.webAgent = new WebAgent(http);
    this.contacts = new Contacts(http);
    this.account = new Account(http);
    this.voices = new Voices(http);
    this.organisation = new Organisation(http);
    this.integrations = new Integrations(http);
    this.agents = new Agents(http);
    this.calls = new Calls(http);
    this.campaigns = new Campaigns(http);
    this.phoneNumbers = new PhoneNumbers(http);
    this.sms = new Sms(http);
    this.keys = new Keys(http);
    this.usage = new UsageResource(http);
    this.webhooks = new Webhooks(http);
    this.callers = new Callers(http);
  }

  /** Create a brand-new API key (unauthenticated signup endpoint - most
   * developers use the dashboard instead). The key_secret is shown ONCE.
   * Rate-limited per IP to prevent abuse. */
  static async createKey(params: { name?: string | null; email?: string | null } = {}, baseUrl = 'https://api.nixflex.com'): Promise<KeyCreateResponse> {
    return createKey(params, baseUrl);
  }
}

export default Nixflex;
export type { NixflexClientOptions, RequestOptions };
export { HttpClient, SDK_VERSION } from './client.js';
export * from './types/campaign-policy.js';
export * from './types/campaign-controls.js';
export * from './errors.js';
export * from './types/agents.js';
export * from './types/calls.js';
export * from './types/call-reads.js';
export * from './types/phone-numbers.js';
export * from './types/number-usage.js';
export * from './types/sms.js';
export * from './types/account.js';
export * from './types/callers.js';
export { verifyWebhookSignature, type VerifyOptions } from './webhook-verify.js';
