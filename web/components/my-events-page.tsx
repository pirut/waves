"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api, type Id } from "@/lib/convex-api";

import { useViewer } from "@/components/viewer-context";
import { formatRsvpLabel, RSVP_OPTIONS, type RsvpStatus } from "@/lib/events";
import { formatEventWindow } from "@/lib/formatters";

type EventListItem = {
  id: Id<"events">;
  title: string;
  category: string;
  city: string;
  country: string;
  startAt: number;
  endAt: number;
  attendeeCount: number;
  coverImageUrl?: string;
  impactSummary?: string;
  viewerRsvp?: RsvpStatus;
  organizer: {
    displayName: string;
  };
};

type ViewerEvents = {
  attending: EventListItem[];
  hosting: EventListItem[];
};

function getBadgeClass(status?: RsvpStatus) {
  if (status === "going") {
    return "badge badge-going";
  }

  if (status === "interested") {
    return "badge badge-interested";
  }

  if (status === "not_going") {
    return "badge badge-not-going";
  }

  return "";
}

export function MyEventsPage() {
  const { viewerReady } = useViewer();
  const [pendingRsvpEventId, setPendingRsvpEventId] = useState<string | null>(null);
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  const viewerEventsResult = useQuery(api.events.listForViewer, viewerReady ? {} : "skip");
  const viewerEvents = (viewerEventsResult ?? { attending: [], hosting: [] }) as ViewerEvents;

  const onRsvp = async (eventId: Id<"events">, status: RsvpStatus) => {
    setPendingRsvpEventId(eventId);
    try {
      await rsvpToEvent({ eventId, status });
    } finally {
      setPendingRsvpEventId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">
            Combined planner for what you host and what you are attending.
          </p>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Hosting</p>
          <p className="stat-value">{viewerEvents.hosting.length}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Attending</p>
          <p className="stat-value">{viewerEvents.attending.length}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total scheduled</p>
          <p className="stat-value">{viewerEvents.hosting.length + viewerEvents.attending.length}</p>
        </article>
      </section>

      {viewerEventsResult === undefined ? (
        <div className="viewer-state">Loading your events...</div>
      ) : (
        <section className="two-column">
          <article className="panel">
            <h2 className="panel-title">Hosting</h2>
            <p className="panel-subtitle">Events you organize.</p>
            {viewerEvents.hosting.length === 0 ? (
              <div className="empty-state">You are not hosting any events yet.</div>
            ) : (
              <div className="timeline">
                {viewerEvents.hosting.map((eventItem) => (
                  <article className="timeline-item" key={eventItem.id}>
                    <p className="timeline-title">
                      <Link className="text-link" href={`/events/${eventItem.id}`}>
                        {eventItem.title}
                      </Link>
                    </p>
                    <p className="timeline-meta">
                      {eventItem.category} · {eventItem.city} · {eventItem.attendeeCount} attendees
                    </p>
                    <p className="timeline-meta">{formatEventWindow(eventItem.startAt, eventItem.endAt)}</p>
                    <p className="timeline-body">
                      {eventItem.impactSummary ?? `Hosted by ${eventItem.organizer.displayName}`}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="panel">
            <h2 className="panel-title">Attending</h2>
            <p className="panel-subtitle">Events in your personal schedule.</p>
            {viewerEvents.attending.length === 0 ? (
              <div className="empty-state">You have not RSVPed to events yet.</div>
            ) : (
              <div className="timeline">
                {viewerEvents.attending.map((eventItem) => {
                  const badgeClass = getBadgeClass(eventItem.viewerRsvp);

                  return (
                    <article className="timeline-item" key={eventItem.id}>
                      <p className="timeline-title">
                        <Link className="text-link" href={`/events/${eventItem.id}`}>
                          {eventItem.title}
                        </Link>
                      </p>
                      <p className="timeline-meta">
                        {eventItem.category} · {eventItem.city} · {eventItem.country}
                      </p>
                      <p className="timeline-meta">{formatEventWindow(eventItem.startAt, eventItem.endAt)}</p>
                      {badgeClass ? (
                        <span className={badgeClass}>{formatRsvpLabel(eventItem.viewerRsvp)}</span>
                      ) : null}
                      <div className="rsvp-row">
                        {RSVP_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            className={`rsvp-btn${eventItem.viewerRsvp === option.value ? " rsvp-btn-active" : ""}`}
                            disabled={pendingRsvpEventId === eventItem.id}
                            onClick={() => void onRsvp(eventItem.id, option.value)}
                            type="button">
                            {pendingRsvpEventId === eventItem.id ? "Saving..." : option.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      )}
    </>
  );
}
