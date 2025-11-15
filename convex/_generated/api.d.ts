/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
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
  auth: typeof auth;
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
