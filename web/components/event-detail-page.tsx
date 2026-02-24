"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

import { useViewer } from "@/components/viewer-context";
import { formatRsvpLabel, RSVP_OPTIONS, type RsvpStatus } from "@/lib/events";
import { formatEventWindow, formatRelativeTime } from "@/lib/formatters";

type EventDetail = {
  event: {
    id: Id<"events">;
    title: string;
    description: string;
    category: string;
    startAt: number;
    endAt: number;
    city: string;
    region?: string;
    country: string;
    addressLine1: string;
    coverImageUrl?: string;
    impactSummary?: string;
    attendeeCount: number;
  };
  organizer: {
    displayName: string;
  };
  viewerRsvp?: RsvpStatus;
  attendeeBreakdown: {
    going: number;
    interested: number;
    notGoing: number;
    total: number;
  };
  attendees: Array<{
    profile: {
      id: Id<"profiles">;
      displayName: string;
      city?: string;
    };
    status: RsvpStatus;
  }>;
  messages: Array<{
    id: Id<"eventMessages">;
    body: string;
    kind: "announcement" | "update";
    createdAt: number;
    author: {
      displayName: string;
    };
    likeCount: number;
    commentCount: number;
    viewerHasLiked: boolean;
  }>;
};

export function EventDetailPage({ eventId }: { eventId: string }) {
  const { viewerReady } = useViewer();
  const [pendingRsvpStatus, setPendingRsvpStatus] = useState<RsvpStatus | null>(null);
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);
  const toggleLike = useMutation(api.feed.toggleLikeOnUpdate);

  const eventDetailResult = useQuery(
    api.events.getById,
    viewerReady
      ? {
          eventId: eventId as Id<"events">,
        }
      : "skip",
  );

  const eventDetail = (eventDetailResult ?? null) as EventDetail | null;

  const onRsvp = async (status: RsvpStatus) => {
    if (!eventDetail) {
      return;
    }

    setPendingRsvpStatus(status);
    try {
      await rsvpToEvent({
        eventId: eventDetail.event.id,
        status,
      });
    } finally {
      setPendingRsvpStatus(null);
    }
  };

  const onToggleLike = async (messageId: Id<"eventMessages">) => {
    setPendingLikeId(messageId);
    try {
      await toggleLike({
        eventMessageId: messageId,
      });
    } finally {
      setPendingLikeId(null);
    }
  };

  if (eventDetailResult === undefined) {
    return <div className="viewer-state">Loading event...</div>;
  }

  if (!eventDetail) {
    return <div className="empty-state">Event not found or unavailable.</div>;
  }

  const locationLine = [eventDetail.event.city, eventDetail.event.region, eventDetail.event.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Event Detail</h1>
          <p className="page-subtitle">Live event record shared across native and web clients.</p>
        </div>
      </header>

      <section className="detail-hero">
        <div className="panel">
          <div className="detail-cover">
            {eventDetail.event.coverImageUrl ? (
              <img alt={`${eventDetail.event.title} cover`} src={eventDetail.event.coverImageUrl} />
            ) : null}
          </div>
        </div>
        <article className="panel detail-copy">
          <h2 className="detail-title">{eventDetail.event.title}</h2>
          <p className="detail-meta">{eventDetail.event.category}</p>
          <p className="detail-meta">{formatEventWindow(eventDetail.event.startAt, eventDetail.event.endAt)}</p>
          <p className="detail-meta">{locationLine}</p>
          <p className="detail-meta">{eventDetail.event.addressLine1}</p>
          <p className="detail-description">{eventDetail.event.description}</p>
          {eventDetail.event.impactSummary ? (
            <p className="detail-description">{eventDetail.event.impactSummary}</p>
          ) : null}
          <p className="timeline-meta">Hosted by {eventDetail.organizer.displayName}</p>
          <span className="badge badge-interested">{formatRsvpLabel(eventDetail.viewerRsvp)}</span>
          <div className="rsvp-row">
            {RSVP_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`rsvp-btn${eventDetail.viewerRsvp === option.value ? " rsvp-btn-active" : ""}`}
                disabled={pendingRsvpStatus !== null}
                onClick={() => void onRsvp(option.value)}
                type="button">
                {pendingRsvpStatus === option.value ? "Saving..." : option.label}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2 className="panel-title">Breakdown</h2>
          <p className="panel-subtitle">{eventDetail.event.attendeeCount} current attendees</p>
          <ul className="summary-list">
            <li className="summary-item">
              <p className="summary-title">Going: {eventDetail.attendeeBreakdown.going}</p>
            </li>
            <li className="summary-item">
              <p className="summary-title">Interested: {eventDetail.attendeeBreakdown.interested}</p>
            </li>
            <li className="summary-item">
              <p className="summary-title">Not Going: {eventDetail.attendeeBreakdown.notGoing}</p>
            </li>
            <li className="summary-item">
              <p className="summary-title">Total tracked: {eventDetail.attendeeBreakdown.total}</p>
            </li>
          </ul>
        </article>

        <article className="panel">
          <h2 className="panel-title">Attendees</h2>
          {eventDetail.attendees.length === 0 ? (
            <div className="empty-state">No attendees yet.</div>
          ) : (
            <ul className="summary-list">
              {eventDetail.attendees.slice(0, 12).map((attendee) => (
                <li className="summary-item" key={attendee.profile.id}>
                  <p className="summary-title">{attendee.profile.displayName}</p>
                  <p className="summary-meta">
                    {formatRsvpLabel(attendee.status)}
                    {attendee.profile.city ? ` · ${attendee.profile.city}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="panel">
        <h2 className="panel-title">Recent updates</h2>
        {eventDetail.messages.length === 0 ? (
          <div className="empty-state">No posts for this event yet.</div>
        ) : (
          <div className="timeline">
            {eventDetail.messages.map((message) => (
              <article className="timeline-item" key={message.id}>
                <div className="timeline-header">
                  <p className="timeline-title">{message.kind === "announcement" ? "Announcement" : "Update"}</p>
                  <p className="timeline-meta">{formatRelativeTime(message.createdAt)}</p>
                </div>
                <p className="timeline-meta">By {message.author.displayName}</p>
                <p className="timeline-body">{message.body}</p>
                <div className="timeline-actions">
                  <button
                    className={`timeline-like${message.viewerHasLiked ? " timeline-like-active" : ""}`}
                    disabled={pendingLikeId === message.id}
                    onClick={() => void onToggleLike(message.id)}
                    type="button">
                    {pendingLikeId === message.id ? "Saving..." : message.viewerHasLiked ? "Liked" : "Like"} (
                    {message.likeCount})
                  </button>
                  <span className="timeline-meta">{message.commentCount} comments</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
