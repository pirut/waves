// seed.ts — dev fixture data for Make Waves.
//
// Ports waves/project/components/data.jsx verbatim:
//   - 6 fixture users (maya, leo, aditi, sam, jun, rita) — the "me" user
//     from the prototype maps to whoever signs in at runtime; see
//     `users.bootstrap` (below) for the signed-in user's profile + rsvps.
//   - 9 events in SF, xy (0–1000) linearly mapped to lat/lng.
//   - Rsvps from `going[]` (filtered to fixture users).
//   - Comments + updates per the fixture data.
//
// Run with:
//   npx convex run seed:wipe   # clear stale Make Waves data (keeps auth users)
//   npx convex run seed:run    # populate world fixtures
//
// Idempotent — re-running `seed:run` is a no-op (lookups by fixture email /
// event title).

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  mutation,
  type MutationCtx,
} from './_generated/server';
import { requireUser } from './lib/authz';

// ─── World fixtures ────────────────────────────────────────────────────

type UserKey = 'maya' | 'leo' | 'aditi' | 'sam' | 'jun' | 'rita';

type FixtureUser = {
  key: UserKey;
  email: string;
  name: string;
  initials: string;
  hours: number;
  badgeCount: number;
  streak: number;
  tone: number;
};

const FIXTURE_USERS: readonly FixtureUser[] = [
  { key: 'maya',  email: 'maya@waves.local',  name: 'Maya Okonkwo', initials: 'MO', hours: 132, badgeCount: 14, streak: 22, tone: 40 },
  { key: 'leo',   email: 'leo@waves.local',   name: 'Leo Park',     initials: 'LP', hours: 67,  badgeCount: 9,  streak: 3,  tone: 140 },
  { key: 'aditi', email: 'aditi@waves.local', name: 'Aditi Rao',    initials: 'AR', hours: 210, badgeCount: 19, streak: 44, tone: 80 },
  { key: 'sam',   email: 'sam@waves.local',   name: 'Sam Ellis',    initials: 'SE', hours: 18,  badgeCount: 3,  streak: 2,  tone: 320 },
  { key: 'jun',   email: 'jun@waves.local',   name: 'Jun Abara',    initials: 'JA', hours: 91,  badgeCount: 11, streak: 8,  tone: 260 },
  { key: 'rita',  email: 'rita@waves.local',  name: 'Rita Valdez',  initials: 'RV', hours: 56,  badgeCount: 6,  streak: 4,  tone: 10  },
] as const;

type Category =
  | 'cleanup' | 'food' | 'garden' | 'elders' | 'tutor'
  | 'animals' | 'blood' | 'outreach' | 'repairs';

type FixtureEvent = {
  key: string; // 'e1' … 'e9'
  title: string;
  category: Category;
  host: UserKey;
  hostOrg: string;
  /** Days from now until `startsAt`. Matches prototype timestamps like "in 3 days". */
  startsInDays: number;
  /** Hours duration. Used to derive endsAt from startsAt. */
  durationHours: number;
  location: string;
  address: string;
  x: number;
  y: number;
  attendees: number;
  capacity: number;
  going: UserKey[];
  signedUpForMe: boolean;
  hours: number;
  description: string;
  meetingPoint: string;
  bring: string[];
  updates: { author: UserKey; atHoursAgo: number; body: string }[];
  comments: { author: UserKey; atMinutesAgo: number; body: string }[];
};

const FIXTURE_EVENTS: readonly FixtureEvent[] = [
  {
    key: 'e1',
    title: 'Ocean Beach Sunrise Cleanup',
    category: 'cleanup',
    host: 'maya',
    hostOrg: 'Pacific Coast Collective',
    startsInDays: 3,
    durationHours: 2.5,
    location: 'Ocean Beach, SF',
    address: 'Great Hwy & Judah St',
    x: 150, y: 520,
    attendees: 47, capacity: 80,
    going: ['maya', 'leo', 'aditi', 'sam', 'jun'],
    signedUpForMe: true,
    hours: 2.5,
    description:
      'Monthly sunrise sweep from Judah to Sloat. We sort debris for the microplastic study and finish with hot coffee from Andytown. Gloves & bags provided — bring a reusable bottle.',
    meetingPoint: 'Blue flag near the Judah St parking lot.',
    bring: ['Closed-toe shoes', 'Reusable water bottle', 'Warm layers'],
    updates: [
      { author: 'maya', atHoursAgo: 2, body: "Forecast looks clear — 54°F, light wind. We'll need extra volunteers on the south end near Sloat; a storm pushed a lot of kelp there." },
      { author: 'maya', atHoursAgo: 28, body: 'Andytown is sponsoring us again — free coffee for everyone who signs in before 7am.' },
    ],
    comments: [
      { author: 'leo',   atMinutesAgo: 60, body: 'Bringing my niece (12) — is that ok?' },
      { author: 'maya',  atMinutesAgo: 55, body: 'Absolutely, anyone 10+ is welcome with a guardian.' },
      { author: 'sam',   atMinutesAgo: 22, body: 'Can I bike there? Is there parking for bikes?' },
      { author: 'aditi', atMinutesAgo: 15, body: "Yes — racks by the restrooms. I'll wait there at 6:20 if anyone wants to ride in together from the Panhandle." },
    ],
  },
  {
    key: 'e2',
    title: 'Tenderloin Community Dinner',
    category: 'food',
    host: 'leo',
    hostOrg: "St. Anthony's",
    startsInDays: 1,
    durationHours: 3,
    location: 'Tenderloin, SF',
    address: '150 Golden Gate Ave',
    x: 480, y: 340,
    attendees: 12, capacity: 15,
    going: ['leo', 'jun', 'rita'],
    signedUpForMe: true,
    hours: 3,
    description:
      'Help prepare and serve ~400 meals. Roles: prep, line server, dish, greeter. No experience needed — the kitchen leads run a quick orientation at 4:45.',
    meetingPoint: 'Volunteer entrance on Jones St.',
    bring: ['Closed-toe shoes', 'Hair tie if long hair'],
    updates: [
      { author: 'leo', atHoursAgo: 3, body: "We have 3 greeter spots open and 1 prep — everything else is full. First-timers, grab greeter, it's the best intro role." },
    ],
    comments: [
      { author: 'jun', atMinutesAgo: 120, body: 'Will there be a second orientation for people arriving at 5?' },
      { author: 'leo', atMinutesAgo: 60,  body: "Yes, I'll run a short one at 5:10." },
    ],
  },
  {
    key: 'e3',
    title: 'Glen Canyon Native Planting',
    category: 'garden',
    host: 'aditi',
    hostOrg: 'SF Rec & Parks',
    startsInDays: 4,
    durationHours: 3,
    location: 'Glen Canyon Park',
    address: 'Elk & Chenery St',
    x: 460, y: 600,
    attendees: 23, capacity: 40,
    going: ['aditi', 'maya', 'rita'],
    signedUpForMe: false,
    hours: 3,
    description:
      'Planting 200 coastal sage, yarrow, and California poppy seedlings along the restored creek bed. Light digging and mulching — family-friendly.',
    meetingPoint: 'Recreation Center lawn.',
    bring: ['Sun hat', 'Work gloves (we have extras)', 'Water'],
    updates: [],
    comments: [],
  },
  {
    key: 'e4',
    title: 'Laguna Honda Game Afternoon',
    category: 'elders',
    host: 'rita',
    hostOrg: 'Laguna Honda Hospital',
    startsInDays: 9,
    durationHours: 2.5,
    location: 'Forest Hill, SF',
    address: '375 Laguna Honda Blvd',
    x: 360, y: 520,
    attendees: 6, capacity: 10,
    going: ['rita', 'sam'],
    signedUpForMe: false,
    hours: 2.5,
    description:
      'Play cards, chess, and checkers with residents on the 4th floor. A wonderful, low-key way to spend an afternoon.',
    meetingPoint: 'Main lobby — ask for Rita.',
    bring: ['Photo ID', 'A smile'],
    updates: [],
    comments: [],
  },
  {
    key: 'e5',
    title: "Saturday Kids' Reading Hour",
    category: 'tutor',
    host: 'jun',
    hostOrg: 'Mission Branch Library',
    startsInDays: 3,
    durationHours: 1.5,
    location: 'Mission District',
    address: '300 Bartlett St',
    x: 580, y: 510,
    attendees: 8, capacity: 12,
    going: ['jun', 'aditi'],
    signedUpForMe: false,
    hours: 1.5,
    description:
      'Read 1:1 with kids ages 5–9. Books are provided at all levels. Bilingual (Spanish) readers especially welcome.',
    meetingPoint: "Children's section, back left.",
    bring: ['Nothing — books provided'],
    updates: [],
    comments: [],
  },
  {
    key: 'e6',
    title: 'SPCA Dog Walkers',
    category: 'animals',
    host: 'sam',
    hostOrg: 'SF SPCA',
    startsInDays: 4,
    durationHours: 2,
    location: 'Mission District',
    address: '250 Florida St',
    x: 640, y: 450,
    attendees: 14, capacity: 20,
    going: ['sam', 'leo', 'maya'],
    signedUpForMe: false,
    hours: 2,
    description:
      'Walk adoptable dogs around Potrero Hill. One-time volunteers welcome; returning walkers can take the reactive dogs after the 8am briefing.',
    meetingPoint: 'SPCA side entrance on Alabama.',
    bring: ['Comfortable shoes'],
    updates: [],
    comments: [],
  },
  {
    key: 'e7',
    title: 'Mobile Blood Drive — Hayes Valley',
    category: 'blood',
    host: 'maya',
    hostOrg: 'Vitalant',
    startsInDays: 15,
    durationHours: 6,
    location: 'Hayes Valley',
    address: '500 Laguna St',
    x: 430, y: 410,
    attendees: 28, capacity: 60,
    going: ['maya', 'jun', 'rita'],
    signedUpForMe: false,
    hours: 1,
    description:
      'Book a 30-min slot. Bring ID, eat a full meal beforehand, and hydrate. First-time donors get a full walkthrough.',
    meetingPoint: 'Vitalant van out front.',
    bring: ['Government ID', 'List of medications'],
    updates: [],
    comments: [],
  },
  {
    key: 'e8',
    title: 'Civic Center Outreach Walk',
    category: 'outreach',
    host: 'aditi',
    hostOrg: 'GLIDE',
    startsInDays: 2,
    durationHours: 2.5,
    location: 'Civic Center',
    address: 'GLIDE, 330 Ellis St',
    x: 470, y: 360,
    attendees: 9, capacity: 12,
    going: ['aditi', 'leo'],
    signedUpForMe: false,
    hours: 2.5,
    description:
      "Hand out hygiene kits, socks, and hot meals in pairs. Training from GLIDE staff at 7 sharp — please don't be late.",
    meetingPoint: 'GLIDE front desk.',
    bring: ['Walking shoes', 'Warm jacket'],
    updates: [],
    comments: [],
  },
  {
    key: 'e9',
    title: 'Bayview Community Bike Repair',
    category: 'repairs',
    host: 'jun',
    hostOrg: 'Bayview Bike Co-op',
    startsInDays: 10,
    durationHours: 3,
    location: 'Bayview, SF',
    address: '1550 Evans Ave',
    x: 720, y: 620,
    attendees: 5, capacity: 8,
    going: ['jun'],
    signedUpForMe: false,
    hours: 3,
    description:
      "Fix up donated bikes for neighborhood kids. Mechanics & apprentices both welcome — we'll pair you up.",
    meetingPoint: 'Roll-up door on Evans.',
    bring: ['Grubby clothes'],
    updates: [],
    comments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/**
 * Linear mapping of prototype canvas (0–1000) to a rough SF bounding box.
 * x → lng (west to east), y → lat (north to south, since y=0 is top).
 */
function xyToLatLng(x: number, y: number): { lat: number; lng: number } {
  const lng = -122.515 + (x / 1000) * 0.16;
  const lat = 37.81 - (y / 1000) * 0.105;
  return { lat, lng };
}

async function upsertFixtureUser(
  ctx: MutationCtx,
  u: FixtureUser,
): Promise<Id<'users'>> {
  const existing = await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', u.email))
    .unique();
  if (existing) {
    // Patch any missing Make Waves profile fields (idempotent).
    await ctx.db.patch(existing._id, {
      name: u.name,
      initials: u.initials,
      hours: u.hours,
      badgeCount: u.badgeCount,
      streak: u.streak,
      tone: u.tone,
    });
    return existing._id;
  }
  return await ctx.db.insert('users', {
    email: u.email,
    name: u.name,
    initials: u.initials,
    hours: u.hours,
    badgeCount: u.badgeCount,
    streak: u.streak,
    tone: u.tone,
  });
}

async function findEventByTitle(
  ctx: MutationCtx,
  title: string,
): Promise<Doc<'events'> | null> {
  // No title index needed at seed scale (~10 events). Scan.
  const all = await ctx.db.query('events').collect();
  return all.find((e) => e.title === title) ?? null;
}

// ─── seed:run — world fixtures ────────────────────────────────────────

export const run = mutation({
  args: {},
  returns: v.object({
    users: v.number(),
    events: v.number(),
    rsvps: v.number(),
    comments: v.number(),
    updates: v.number(),
  }),
  handler: async (ctx): Promise<{
    users: number;
    events: number;
    rsvps: number;
    comments: number;
    updates: number;
  }> => {
    const now = Date.now();

    // 1. Users.
    const userIds: Record<UserKey, Id<'users'>> = {} as Record<UserKey, Id<'users'>>;
    for (const u of FIXTURE_USERS) {
      userIds[u.key] = await upsertFixtureUser(ctx, u);
    }

    // 2. Events (+ rsvps + comments + updates).
    let events = 0;
    let rsvps = 0;
    let comments = 0;
    let updates = 0;

    for (const e of FIXTURE_EVENTS) {
      const existing = await findEventByTitle(ctx, e.title);
      const { lat, lng } = xyToLatLng(e.x, e.y);
      const startsAt = now + e.startsInDays * DAY_MS;
      const endsAt = startsAt + Math.round(e.durationHours * HOUR_MS);

      let eventId: Id<'events'>;
      if (existing) {
        await ctx.db.patch(existing._id, {
          title: e.title,
          category: e.category,
          hostId: userIds[e.host],
          hostOrg: e.hostOrg,
          description: e.description,
          meetingPoint: e.meetingPoint,
          bring: e.bring,
          startsAt,
          endsAt,
          location: e.location,
          address: e.address,
          lat,
          lng,
          capacity: e.capacity,
          attendees: e.attendees,
          hours: e.hours,
        });
        eventId = existing._id;
      } else {
        eventId = await ctx.db.insert('events', {
          title: e.title,
          category: e.category,
          hostId: userIds[e.host],
          hostOrg: e.hostOrg,
          description: e.description,
          meetingPoint: e.meetingPoint,
          bring: e.bring,
          startsAt,
          endsAt,
          location: e.location,
          address: e.address,
          lat,
          lng,
          capacity: e.capacity,
          attendees: e.attendees,
          hours: e.hours,
        });
        events += 1;
      }

      // RSVPs for the fixture users in `going[]` (idempotent).
      for (const g of e.going) {
        const uid = userIds[g];
        const has = await ctx.db
          .query('rsvps')
          .withIndex('by_event_user', (q) => q.eq('eventId', eventId).eq('userId', uid))
          .unique();
        if (!has) {
          await ctx.db.insert('rsvps', { eventId, userId: uid, status: 'going' });
          rsvps += 1;
        }
      }

      // Updates (idempotent — skip if the event already has any).
      const existingUpdates = await ctx.db
        .query('eventUpdates')
        .withIndex('by_event', (q) => q.eq('eventId', eventId))
        .collect();
      if (existingUpdates.length === 0) {
        for (const u of e.updates) {
          const atTime = now - u.atHoursAgo * HOUR_MS;
          await ctx.db.insert('eventUpdates', {
            eventId,
            userId: userIds[u.author],
            body: u.body,
          });
          // eventUpdates has no `createdAt` column — Convex auto-populates _creationTime.
          // We can't easily backdate it, so the "2h ago" label on the UI should be
          // derived from _creationTime or remain as fixture-only copy.
          void atTime;
          updates += 1;
        }
      }

      // Comments (idempotent — skip if the event already has any).
      const existingComments = await ctx.db
        .query('comments')
        .withIndex('by_event_createdAt', (q) => q.eq('eventId', eventId))
        .collect();
      if (existingComments.length === 0) {
        for (const c of e.comments) {
          const atTime = now - c.atMinutesAgo * MINUTE_MS;
          await ctx.db.insert('comments', {
            eventId,
            userId: userIds[c.author],
            body: c.body,
          });
          void atTime;
          comments += 1;
        }
      }
    }

    return {
      users: FIXTURE_USERS.length,
      events,
      rsvps,
      comments,
      updates,
    };
  },
});

// ─── seed:bootstrapMe — signed-in user's profile + personal data ─────

type NotifSeed = {
  eventKey: string | null;
  from: UserKey | null;
  kind: 'update' | 'reply' | 'reminder' | 'badge' | 'new' | 'thanks';
  body: string;
  unread: boolean;
};

const ME_NOTIFICATIONS: readonly NotifSeed[] = [
  { eventKey: 'e1', from: 'maya',  kind: 'update',   body: 'posted an update: "Forecast looks clear…"',                    unread: true  },
  { eventKey: 'e1', from: 'aditi', kind: 'reply',    body: 'replied to your comment about bike parking.',                  unread: true  },
  { eventKey: 'e2', from: null,    kind: 'reminder', body: 'Tomorrow at 5pm — Tenderloin Community Dinner.',               unread: true  },
  { eventKey: null, from: null,    kind: 'badge',    body: 'You earned the Second Wave badge — 5 cleanups!',               unread: false },
  { eventKey: 'e9', from: 'jun',   kind: 'new',      body: 'posted a new event near you: Bayview Bike Repair.',            unread: false },
  { eventKey: 'e2', from: 'leo',   kind: 'thanks',   body: "thanked you for coming to last month's dinner",                unread: false },
];

type BadgeSeed = { id: string; earned: boolean };
const ME_BADGES: readonly BadgeSeed[] = [
  { id: 'b1', earned: true  },
  { id: 'b2', earned: true  },
  { id: 'b3', earned: true  },
  { id: 'b4', earned: true  },
  { id: 'b5', earned: true  },
  { id: 'b6', earned: true  },
  { id: 'b7', earned: true  },
  { id: 'b8', earned: false },
  { id: 'b9', earned: false },
];

/**
 * One-time init for the signed-in user. Idempotent — safe to call on every
 * app launch. Populates profile fields matching data.jsx's `me` fixture,
 * creates rsvps on the two `signedUpForMe` events, and seeds notifications +
 * badge progress.
 */
export const bootstrapMe = mutation({
  args: {},
  returns: v.object({
    profileUpdated: v.boolean(),
    rsvpsCreated: v.number(),
    notificationsCreated: v.number(),
    badgesCreated: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // 1. Profile — only patch missing fields (so real input like custom name
    //    doesn't get clobbered).
    let profileUpdated = false;
    const patches: Partial<Doc<'users'>> = {};
    if (user.tone == null) patches.tone = 200;
    if (user.initials == null) patches.initials = 'YO';
    if (user.hours == null) patches.hours = 48;
    if (user.streak == null) patches.streak = 5;
    if (user.badgeCount == null) patches.badgeCount = 7;
    if (user.name == null) patches.name = 'You';
    if (Object.keys(patches).length > 0) {
      await ctx.db.patch(userId, patches);
      profileUpdated = true;
    }

    // 2. RSVPs on signedUpForMe events.
    let rsvpsCreated = 0;
    const allEvents = await ctx.db.query('events').collect();
    const byTitle = new Map(allEvents.map((e) => [e.title, e]));
    const signedUpEvents = FIXTURE_EVENTS.filter((e) => e.signedUpForMe);
    for (const fix of signedUpEvents) {
      const ev = byTitle.get(fix.title);
      if (!ev) continue;
      const has = await ctx.db
        .query('rsvps')
        .withIndex('by_event_user', (q) => q.eq('eventId', ev._id).eq('userId', userId))
        .unique();
      if (!has) {
        await ctx.db.insert('rsvps', { eventId: ev._id, userId, status: 'going' });
        rsvpsCreated += 1;
      }
    }

    // 3. Notifications — only if the user has zero existing notifications
    //    (avoids dupes on re-run, but keeps real post-seed notifications
    //    untouched if the user already has any).
    let notificationsCreated = 0;
    const existingNotifs = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(1);
    if (existingNotifs.length === 0) {
      // Pre-resolve fixture user IDs by email for notif.fromUserId.
      const fixtureUsersByKey = new Map<UserKey, Id<'users'>>();
      for (const u of FIXTURE_USERS) {
        const doc = await ctx.db
          .query('users')
          .withIndex('email', (q) => q.eq('email', u.email))
          .unique();
        if (doc) fixtureUsersByKey.set(u.key, doc._id);
      }
      const byKey = new Map<string, Id<'events'>>();
      for (const f of FIXTURE_EVENTS) {
        const ev = byTitle.get(f.title);
        if (ev) byKey.set(f.key, ev._id);
      }

      for (const n of ME_NOTIFICATIONS) {
        await ctx.db.insert('notifications', {
          userId,
          kind: n.kind,
          eventId: n.eventKey ? byKey.get(n.eventKey) : undefined,
          fromUserId: n.from ? fixtureUsersByKey.get(n.from) : undefined,
          body: n.body,
          unread: n.unread,
        });
        notificationsCreated += 1;
      }
    }

    // 4. Badge progress — upsert catalog entries per ME_BADGES.
    let badgesCreated = 0;
    for (const b of ME_BADGES) {
      const existing = await ctx.db
        .query('badgeProgress')
        .withIndex('by_user_badge', (q) => q.eq('userId', userId).eq('badgeId', b.id))
        .unique();
      if (existing) continue;
      await ctx.db.insert('badgeProgress', {
        userId,
        badgeId: b.id,
        earned: b.earned,
        earnedAt: b.earned ? Date.now() : undefined,
      });
      badgesCreated += 1;
    }

    return {
      profileUpdated,
      rsvpsCreated,
      notificationsCreated,
      badgesCreated,
    };
  },
});

// ─── seed:wipe — clear Make Waves domain data ─────────────────────────
//
// Deletes every row in the Make Waves domain tables. Safe to run before
// (or instead of) `seed:run` when the deployment has stale data from a
// previous schema or project.
//
// By default, **does not** touch Convex Auth tables (users,
// authAccounts, authSessions, etc.) — preserving sign-in credentials.
// Pass `{ includeUsers: true }` to also delete every row in `users`,
// which effectively resets every account (they'll have to sign up again).

async function wipeTable(ctx: MutationCtx, name: string) {
  const table = name as Parameters<typeof ctx.db.query>[0];
  let deleted = 0;
  // Paginate by collecting IDs then deleting — for seed-scale data this
  // fits in a single mutation, but we cap at 10k to avoid runaway.
  const rows = await ctx.db.query(table).take(10000);
  for (const row of rows) {
    await ctx.db.delete(row._id);
    deleted += 1;
  }
  return deleted;
}

export const wipe = mutation({
  args: {
    includeUsers: v.optional(v.boolean()),
  },
  returns: v.object({
    events: v.number(),
    rsvps: v.number(),
    comments: v.number(),
    eventUpdates: v.number(),
    notifications: v.number(),
    checkIns: v.number(),
    savedEvents: v.number(),
    badgeProgress: v.number(),
    users: v.number(),
  }),
  handler: async (ctx, args) => {
    const results = {
      events: await wipeTable(ctx, 'events'),
      rsvps: await wipeTable(ctx, 'rsvps'),
      comments: await wipeTable(ctx, 'comments'),
      eventUpdates: await wipeTable(ctx, 'eventUpdates'),
      notifications: await wipeTable(ctx, 'notifications'),
      checkIns: await wipeTable(ctx, 'checkIns'),
      savedEvents: await wipeTable(ctx, 'savedEvents'),
      badgeProgress: await wipeTable(ctx, 'badgeProgress'),
      users: 0,
    };
    if (args.includeUsers) {
      // Wiping `users` also leaves authAccounts/authSessions orphaned — the
      // next `convex dev` push will flag those as invalid foreign keys. If
      // you want a full auth wipe, use the Convex dashboard "clear tables"
      // or run `seed:wipeAll` below.
      results.users = await wipeTable(ctx, 'users');
    }
    return results;
  },
});

// ─── seed:wipeAll — nuke everything, including auth tables ───────────

export const wipeAll = mutation({
  args: {},
  returns: v.object({
    tables: v.number(),
    rows: v.number(),
  }),
  handler: async (ctx) => {
    const tables = [
      'events',
      'rsvps',
      'comments',
      'eventUpdates',
      'notifications',
      'checkIns',
      'savedEvents',
      'badgeProgress',
      'users',
      // Convex Auth tables:
      'authAccounts',
      'authSessions',
      'authRefreshTokens',
      'authVerificationCodes',
      'authVerifiers',
      'authRateLimits',
    ];
    let rows = 0;
    let wiped = 0;
    for (const t of tables) {
      try {
        rows += await wipeTable(ctx, t);
        wiped += 1;
      } catch {
        // Some auth tables may not exist depending on providers configured;
        // swallow and continue.
      }
    }
    return { tables: wiped, rows };
  },
});
