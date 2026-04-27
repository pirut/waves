/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as badges from "../badges.js";
import type * as checkIns from "../checkIns.js";
import type * as comments from "../comments.js";
import type * as events from "../events.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_tones from "../lib/tones.js";
import type * as notifications from "../notifications.js";
import type * as rsvps from "../rsvps.js";
import type * as savedEvents from "../savedEvents.js";
import type * as seed from "../seed.js";
import type * as updates from "../updates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  badges: typeof badges;
  checkIns: typeof checkIns;
  comments: typeof comments;
  events: typeof events;
  "lib/authz": typeof lib_authz;
  "lib/tones": typeof lib_tones;
  notifications: typeof notifications;
  rsvps: typeof rsvps;
  savedEvents: typeof savedEvents;
  seed: typeof seed;
  updates: typeof updates;
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
