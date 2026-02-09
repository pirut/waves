import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "dispatch-pending-notifications",
  { minutes: 1 },
  internal.notificationsActions.dispatchPending,
  { limit: 100 },
);

export default crons;
