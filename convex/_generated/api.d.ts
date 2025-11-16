/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentCommunication from "../agentCommunication.js";
import type * as agentOrchestrator from "../agentOrchestrator.js";
import type * as agentPrompts from "../agentPrompts.js";
import type * as agentRunner from "../agentRunner.js";
import type * as agentTools from "../agentTools.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as funding from "../funding.js";
import type * as fundingQueries from "../fundingQueries.js";
import type * as http from "../http.js";
import type * as locusIntegration from "../locusIntegration.js";
import type * as messages from "../messages.js";
import type * as stripeWebhookHandlers from "../stripeWebhookHandlers.js";
import type * as stripeWebhooks from "../stripeWebhooks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentCommunication: typeof agentCommunication;
  agentOrchestrator: typeof agentOrchestrator;
  agentPrompts: typeof agentPrompts;
  agentRunner: typeof agentRunner;
  agentTools: typeof agentTools;
  agents: typeof agents;
  auth: typeof auth;
  funding: typeof funding;
  fundingQueries: typeof fundingQueries;
  http: typeof http;
  locusIntegration: typeof locusIntegration;
  messages: typeof messages;
  stripeWebhookHandlers: typeof stripeWebhookHandlers;
  stripeWebhooks: typeof stripeWebhooks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
