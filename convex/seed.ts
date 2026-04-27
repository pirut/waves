// seed.ts — dev fixture data for Make Waves.
//
// West Palm Beach fixture world:
//   - 6 local fixture users; the "me" user maps to whoever signs in at
//     runtime; see `seed.bootstrapMe` below for profile + rsvps.
//   - 9 events around West Palm Beach / Palm Beach County.
//   - RSVPs, saved events, comments, updates, notifications, and badges.
//
// Run with:
//   npx convex run seed:wipe   # clear stale Make Waves data (keeps auth users)
//   npx convex run seed:run    # populate world fixtures
//
// Idempotent - re-running `seed:run` is a no-op (lookups by fixture email /
// event title).

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  mutation,
  type MutationCtx,
} from './_generated/server';
import { requireUser } from './lib/authz';

// --- World fixtures ----------------------------------------------------

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
  { key: 'maya',  email: 'maya@waves.local',  name: 'Maya Bennett',  initials: 'MB', hours: 142, badgeCount: 14, streak: 18, tone: 35 },
  { key: 'leo',   email: 'leo@waves.local',   name: 'Leo Santiago',  initials: 'LS', hours: 76,  badgeCount: 8,  streak: 4,  tone: 145 },
  { key: 'aditi', email: 'aditi@waves.local', name: 'Aditi Rao',     initials: 'AR', hours: 188, badgeCount: 17, streak: 31, tone: 82 },
  { key: 'sam',   email: 'sam@waves.local',   name: 'Sam Ellis',     initials: 'SE', hours: 34,  badgeCount: 4,  streak: 2,  tone: 305 },
  { key: 'jun',   email: 'jun@waves.local',   name: 'Jun Alvarez',   initials: 'JA', hours: 96,  badgeCount: 10, streak: 9,  tone: 230 },
  { key: 'rita',  email: 'rita@waves.local',  name: 'Rita Campbell', initials: 'RC', hours: 61,  badgeCount: 6,  streak: 5,  tone: 12  },
] as const;

type Category =
  | 'cleanup' | 'food' | 'garden' | 'elders' | 'tutor'
  | 'animals' | 'blood' | 'outreach' | 'repairs';

type FixtureEvent = {
  key: string; // 'e1' ... 'e9'
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
  lat: number;
  lng: number;
  attendees: number;
  capacity: number;
  going: UserKey[];
  signedUpForMe: boolean;
  savedForMe?: boolean;
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
    title: 'Lake Trail Sunrise Cleanup',
    category: 'cleanup',
    host: 'maya',
    hostOrg: 'Palm Beach Waterkeeper',
    startsInDays: 3,
    durationHours: 2.5,
    location: 'Palm Beach Lake Trail',
    address: 'Royal Poinciana Way & Lake Trail, Palm Beach, FL',
    lat: 26.7177, lng: -80.0427,
    attendees: 47, capacity: 80,
    going: ['maya', 'leo', 'aditi', 'sam', 'jun'],
    signedUpForMe: true,
    savedForMe: true,
    hours: 2.5,
    description:
      'A sunrise sweep along the Lake Trail before the morning bike traffic picks up. We will log plastics for the lagoon report, separate recyclables, and finish with cafecito near Royal Poinciana.',
    meetingPoint: 'Meet by the benches just south of Royal Poinciana Way.',
    bring: ['Closed-toe shoes', 'Reusable water bottle', 'Sun protection'],
    updates: [
      { author: 'maya', atHoursAgo: 2, body: 'Forecast looks clear with a light breeze off the lagoon. We need two extra people on the north end by the marina slips.' },
      { author: 'maya', atHoursAgo: 28, body: 'Subculture Coffee is sending cold brew for volunteers who check in before 7:15.' },
    ],
    comments: [
      { author: 'leo', atMinutesAgo: 60, body: 'Bringing my niece - is 12 old enough for this one?' },
      { author: 'maya', atMinutesAgo: 55, body: 'Yes, anyone 10+ is welcome with a guardian. We keep younger volunteers near the benches.' },
      { author: 'sam', atMinutesAgo: 22, body: 'Can I bike over from Downtown WPB?' },
      { author: 'aditi', atMinutesAgo: 15, body: 'Yes. I am riding from the Brightline station at 6:35 if anyone wants to meet there.' },
    ],
  },
  {
    key: 'e2',
    title: 'Clematis Community Supper',
    category: 'food',
    host: 'leo',
    hostOrg: 'The Lord\'s Place',
    startsInDays: 1,
    durationHours: 3,
    location: 'Downtown West Palm Beach',
    address: '2808 N Australian Ave, West Palm Beach, FL',
    lat: 26.7361, lng: -80.0658,
    attendees: 18, capacity: 24,
    going: ['leo', 'jun', 'rita'],
    signedUpForMe: true,
    hours: 3,
    description:
      'Prep, plate, and serve dinner for neighbors coming through the evening meal program. The kitchen team runs a quick role briefing, then pairs first-timers with returning volunteers.',
    meetingPoint: 'Volunteer check-in at the side entrance on Australian Ave.',
    bring: ['Closed-toe shoes', 'Hair tie if needed', 'Photo ID'],
    updates: [
      { author: 'leo', atHoursAgo: 3, body: 'We have 4 greeter spots open and 2 prep spots. First-timers, greeter is the best intro role.' },
    ],
    comments: [
      { author: 'jun', atMinutesAgo: 120, body: 'Will there be a second orientation for people arriving after work?' },
      { author: 'leo', atMinutesAgo: 60, body: 'Yes, I will run a short one at 5:20.' },
    ],
  },
  {
    key: 'e3',
    title: 'Okeeheelee Native Planting',
    category: 'garden',
    host: 'aditi',
    hostOrg: 'Palm Beach County Parks',
    startsInDays: 4,
    durationHours: 3,
    location: 'Okeeheelee Park',
    address: '7715 Forest Hill Blvd, West Palm Beach, FL',
    lat: 26.6505, lng: -80.1667,
    attendees: 26, capacity: 44,
    going: ['aditi', 'maya', 'rita'],
    signedUpForMe: false,
    savedForMe: true,
    hours: 3,
    description:
      'Plant native muhly grass, firebush, and dune sunflower around a restored wetland edge. Light digging, mulching, and watering - family-friendly and beginner-friendly.',
    meetingPoint: 'Nature Center parking lot, near the covered pavilion.',
    bring: ['Sun hat', 'Work gloves if you have them', 'Water'],
    updates: [],
    comments: [],
  },
  {
    key: 'e4',
    title: 'MorseLife Game Afternoon',
    category: 'elders',
    host: 'rita',
    hostOrg: 'MorseLife Health System',
    startsInDays: 9,
    durationHours: 2.5,
    location: 'Haverhill Area',
    address: '4847 Fred Gladstone Dr, West Palm Beach, FL',
    lat: 26.7092, lng: -80.1169,
    attendees: 8, capacity: 12,
    going: ['rita', 'sam'],
    signedUpForMe: false,
    hours: 2.5,
    description:
      'Play cards, dominoes, chess, and checkers with residents. A relaxed afternoon for anyone who likes conversation, patience, and a good rematch.',
    meetingPoint: 'Main lobby - ask for Rita at the volunteer desk.',
    bring: ['Photo ID', 'A favorite simple game if you have one'],
    updates: [],
    comments: [],
  },
  {
    key: 'e5',
    title: 'Northwood Kids Reading Hour',
    category: 'tutor',
    host: 'jun',
    hostOrg: 'Mandel Public Library',
    startsInDays: 3,
    durationHours: 1.5,
    location: 'Northwood Village',
    address: '411 Clematis St, West Palm Beach, FL',
    lat: 26.7137, lng: -80.0534,
    attendees: 11, capacity: 16,
    going: ['jun', 'aditi'],
    signedUpForMe: false,
    hours: 1.5,
    description:
      'Read one-on-one with kids ages 5-9 and help them pick a book to take home. Bilingual English/Spanish readers are especially helpful.',
    meetingPoint: 'Children\'s section, near the mural wall.',
    bring: ['Nothing - books are provided'],
    updates: [],
    comments: [],
  },
  {
    key: 'e6',
    title: 'Peggy Adams Dog Walkers',
    category: 'animals',
    host: 'sam',
    hostOrg: 'Peggy Adams Animal Rescue League',
    startsInDays: 4,
    durationHours: 2,
    location: 'Northwood',
    address: '3100 N Military Trl, West Palm Beach, FL',
    lat: 26.7421, lng: -80.1115,
    attendees: 14, capacity: 20,
    going: ['sam', 'leo', 'maya'],
    signedUpForMe: false,
    hours: 2,
    description:
      'Walk adoptable dogs before the shelter opens and help staff refresh the play yards. One-time volunteers welcome; returning walkers can request longer routes.',
    meetingPoint: 'Volunteer gate by the main parking lot.',
    bring: ['Comfortable shoes'],
    updates: [],
    comments: [],
  },
  {
    key: 'e7',
    title: 'Mobile Blood Drive at CityPlace',
    category: 'blood',
    host: 'maya',
    hostOrg: 'OneBlood',
    startsInDays: 15,
    durationHours: 6,
    location: 'CityPlace',
    address: '700 S Rosemary Ave, West Palm Beach, FL',
    lat: 26.7073, lng: -80.0570,
    attendees: 31, capacity: 64,
    going: ['maya', 'jun', 'rita'],
    signedUpForMe: false,
    hours: 1,
    description:
      'Help check in donors, hand out snacks, and fill open donation slots. First-time donors get a full walkthrough from the OneBlood team.',
    meetingPoint: 'Big Red Bus near the Rosemary Ave entrance.',
    bring: ['Government ID', 'List of medications'],
    updates: [],
    comments: [],
  },
  {
    key: 'e8',
    title: 'Riviera Beach Outreach Walk',
    category: 'outreach',
    host: 'aditi',
    hostOrg: 'St. George Center',
    startsInDays: 2,
    durationHours: 2.5,
    location: 'Riviera Beach',
    address: '21 W 22nd St, Riviera Beach, FL',
    lat: 26.7831, lng: -80.0569,
    attendees: 10, capacity: 14,
    going: ['aditi', 'leo'],
    signedUpForMe: false,
    hours: 2.5,
    description:
      'Hand out hygiene kits, socks, and meal cards in pairs. The outreach lead gives a safety briefing and route map before groups leave.',
    meetingPoint: 'Front office on 22nd Street.',
    bring: ['Walking shoes', 'Small backpack'],
    updates: [],
    comments: [],
  },
  {
    key: 'e9',
    title: 'South Olive Bike Repair Pop-Up',
    category: 'repairs',
    host: 'jun',
    hostOrg: 'Palm Beach Bicycle Trail Shop',
    startsInDays: 10,
    durationHours: 3,
    location: 'South Olive Park',
    address: '345 Summa St, West Palm Beach, FL',
    lat: 26.6599, lng: -80.0535,
    attendees: 7, capacity: 12,
    going: ['jun'],
    signedUpForMe: false,
    savedForMe: true,
    hours: 3,
    description:
      'Fix flats, adjust brakes, and tune donated bikes for neighborhood kids. Mechanics and apprentices are both welcome - we pair everyone up.',
    meetingPoint: 'Picnic tables beside the tennis courts.',
    bring: ['Grubby clothes'],
    updates: [],
    comments: [],
  },
];

// --- Helpers -----------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

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

// --- seed:run - world fixtures ----------------------------------------

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
          lat: e.lat,
          lng: e.lng,
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
          lat: e.lat,
          lng: e.lng,
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

// --- seed:bootstrapMe - signed-in user's profile + personal data -------

type NotifSeed = {
  eventKey: string | null;
  from: UserKey | null;
  kind: 'update' | 'reply' | 'reminder' | 'badge' | 'new' | 'thanks';
  body: string;
  unread: boolean;
};

const ME_NOTIFICATIONS: readonly NotifSeed[] = [
  { eventKey: 'e1', from: 'maya', kind: 'update', body: 'posted an update for Lake Trail: clear skies and cold brew.', unread: true },
  { eventKey: 'e1', from: 'aditi', kind: 'reply', body: 'replied to your Brightline bike meetup comment.', unread: true },
  { eventKey: 'e2', from: null, kind: 'reminder', body: 'Tomorrow evening - Clematis Community Supper.', unread: true },
  { eventKey: null, from: null, kind: 'badge', body: 'You earned the Lagoon Steward badge.', unread: false },
  { eventKey: 'e9', from: 'jun', kind: 'new', body: 'posted a bike repair pop-up in South Olive.', unread: false },
  { eventKey: 'e2', from: 'leo', kind: 'thanks', body: 'thanked you for helping downtown last month.', unread: false },
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
 * One-time init for the signed-in user. Idempotent - safe to call on every
 * app launch. Populates profile fields, creates rsvps/saves for local events,
 * and seeds notifications + badge progress.
 */
export const bootstrapMe = mutation({
  args: {},
  returns: v.object({
    profileUpdated: v.boolean(),
    rsvpsCreated: v.number(),
    savedEventsCreated: v.number(),
    notificationsCreated: v.number(),
    badgesCreated: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }

    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // 1. Profile - only patch missing fields (so real input like custom name
    //    doesn't get clobbered).
    let profileUpdated = false;
    const patches: Partial<Doc<'users'>> = {};
    if (user.tone == null) patches.tone = 200;
    if (user.initials == null) patches.initials = 'WP';
    if (user.hours == null) patches.hours = 52;
    if (user.streak == null) patches.streak = 6;
    if (user.badgeCount == null) patches.badgeCount = 8;
    if (user.handle == null) patches.handle = 'wpb-wave-maker';
    if (user.bio == null) patches.bio = 'Finding small ways to make West Palm Beach kinder, cleaner, and more connected.';
    if (user.tokenIdentifier == null) patches.tokenIdentifier = identity.tokenIdentifier;
    if (user.name == null) patches.name = identity.name ?? 'You';
    if (user.email == null && identity.email) patches.email = identity.email;
    if (user.image == null && identity.pictureUrl) patches.image = identity.pictureUrl;
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

    // 3. Saved events from the fixture plan.
    let savedEventsCreated = 0;
    const savedEvents = FIXTURE_EVENTS.filter((e) => e.savedForMe);
    for (const fix of savedEvents) {
      const ev = byTitle.get(fix.title);
      if (!ev) continue;
      const has = await ctx.db
        .query('savedEvents')
        .withIndex('by_event_user', (q) => q.eq('eventId', ev._id).eq('userId', userId))
        .unique();
      if (!has) {
        await ctx.db.insert('savedEvents', { eventId: ev._id, userId });
        savedEventsCreated += 1;
      }
    }

    // 4. Notifications - only if the user has zero existing notifications
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

    // 5. Badge progress - upsert catalog entries per ME_BADGES.
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
      savedEventsCreated,
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
// By default, **does not** touch `users`, preserving linked Clerk-backed
// profiles. Pass `{ includeUsers: true }` to also delete every row in
// `users`, which effectively resets the app profile layer.

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
      results.users = await wipeTable(ctx, 'users');
    }
    return results;
  },
});

// ─── seed:wipeAll — nuke all Make Waves tables ───────────────────────

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
    ];
    let rows = 0;
    let wiped = 0;
    for (const t of tables) {
      rows += await wipeTable(ctx, t);
      wiped += 1;
    }
    return { tables: wiped, rows };
  },
});
