import { router } from "../trpc";
import { eventsRouter } from "./events";
import { usersRouter } from "./users";
import { postsRouter } from "./posts";

export const appRouter = router({
    events: eventsRouter,
    users: usersRouter,
    posts: postsRouter,
});

export type AppRouter = typeof appRouter;
