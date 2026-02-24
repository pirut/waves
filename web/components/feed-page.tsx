"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

import { useViewer } from "@/components/viewer-context";
import { formatEventDate, formatRelativeTime } from "@/lib/formatters";

type FeedUpdate = {
  id: Id<"eventMessages">;
  eventId: Id<"events">;
  eventTitle: string;
  eventStartAt: number;
  body: string;
  kind: "announcement" | "update";
  createdAt: number;
  author: {
    displayName: string;
  };
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
};

export function FeedPage() {
  const { viewerReady } = useViewer();
  const [likePendingId, setLikePendingId] = useState<string | null>(null);
  const toggleLike = useMutation(api.feed.toggleLikeOnUpdate);

  const updatesFeed = usePaginatedQuery(
    api.feed.listUpdatesPaginated,
    viewerReady ? {} : "skip",
    { initialNumItems: 12 },
  );

  const updates = updatesFeed.results as FeedUpdate[];

  const onToggleLike = async (eventMessageId: Id<"eventMessages">) => {
    setLikePendingId(eventMessageId);
    try {
      await toggleLike({ eventMessageId });
    } finally {
      setLikePendingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Community Feed</h1>
          <p className="page-subtitle">
            Updates from events you host or attend, optimized for desktop scanning.
          </p>
        </div>
      </header>

      {updatesFeed.status === "LoadingFirstPage" ? (
        <div className="viewer-state">Loading updates...</div>
      ) : updates.length === 0 ? (
        <div className="empty-state">No updates yet for your events.</div>
      ) : (
        <section className="section-grid">
          <div className="panel">
            <h2 className="panel-title">Latest posts</h2>
            <p className="panel-subtitle">Announcements and updates from the events in your network.</p>
            <div className="timeline">
              {updates.map((update) => (
                <article className="timeline-item" key={update.id}>
                  <div className="timeline-header">
                    <p className="timeline-title">
                      <Link className="text-link" href={`/events/${update.eventId}`}>
                        {update.eventTitle}
                      </Link>
                    </p>
                    <p className="timeline-meta">
                      {formatEventDate(update.eventStartAt)} · {formatRelativeTime(update.createdAt)}
                    </p>
                  </div>
                  <p className="timeline-meta">
                    {update.kind === "announcement" ? "Announcement" : "Update"} by{" "}
                    {update.author.displayName}
                  </p>
                  <p className="timeline-body">{update.body}</p>
                  <div className="timeline-actions">
                    <button
                      className={`timeline-like${update.viewerHasLiked ? " timeline-like-active" : ""}`}
                      disabled={likePendingId === update.id}
                      onClick={() => void onToggleLike(update.id)}
                      type="button">
                      {likePendingId === update.id ? "Saving..." : update.viewerHasLiked ? "Liked" : "Like"} (
                      {update.likeCount})
                    </button>
                    <span className="timeline-meta">{update.commentCount} comments</span>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: "0.85rem" }}>
              <button
                className="btn btn-ghost"
                disabled={updatesFeed.status !== "CanLoadMore"}
                onClick={() => updatesFeed.loadMore(10)}
                type="button">
                {updatesFeed.status === "LoadingMore"
                  ? "Loading..."
                  : updatesFeed.status === "CanLoadMore"
                    ? "Load more posts"
                    : "No more posts"}
              </button>
            </div>
          </div>

          <aside className="panel">
            <h2 className="panel-title">Feed notes</h2>
            <ul className="hero-list">
              <li>This timeline uses the same `eventMessages` data as mobile.</li>
              <li>Likes stay synchronized across iOS, Android, and web.</li>
              <li>Click any event title to jump into full event details.</li>
            </ul>
          </aside>
        </section>
      )}
    </>
  );
}
