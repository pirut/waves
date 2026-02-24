"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

import { useViewer } from "@/components/viewer-context";
import { EVENT_CATEGORIES, formatRsvpLabel, RSVP_OPTIONS, type RsvpStatus } from "@/lib/events";
import { formatEventWindow } from "@/lib/formatters";

type EventListItem = {
  id: Id<"events">;
  slug: string;
  title: string;
  category: string;
  startAt: number;
  endAt: number;
  city: string;
  country: string;
  coverImageUrl?: string;
  impactSummary?: string;
  attendeeCount: number;
  organizer: {
    displayName: string;
  };
  viewerRsvp?: RsvpStatus;
};

const ALL_CATEGORIES = "All categories";
const categories = [ALL_CATEGORIES, ...EVENT_CATEGORIES];

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

export function DiscoverPage() {
  const { viewerReady } = useViewer();
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  const eventsResult = useQuery(
    api.events.listPublished,
    viewerReady
      ? {
          category: selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory,
          limit: 120,
        }
      : "skip",
  );

  const events = useMemo(() => (eventsResult ?? []) as EventListItem[], [eventsResult]);
  const totalAttendees = useMemo(
    () => events.reduce((accumulator, eventItem) => accumulator + eventItem.attendeeCount, 0),
    [events],
  );

  const onRsvp = async (eventId: Id<"events">, status: RsvpStatus) => {
    const key = `${eventId}:${status}`;
    setPendingKey(key);

    try {
      await rsvpToEvent({
        eventId,
        status,
      });
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">
            Traditional web layout with live event data from the same backend as native apps.
          </p>
        </div>
        <div className="chip-row">
          {categories.map((category) => (
            <button
              key={category}
              className={`chip${selectedCategory === category ? " chip-active" : ""}`}
              onClick={() => setSelectedCategory(category)}
              type="button">
              {category}
            </button>
          ))}
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Visible events</p>
          <p className="stat-value">{events.length}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total attendees</p>
          <p className="stat-value">{totalAttendees}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Category</p>
          <p className="stat-value">{selectedCategory === ALL_CATEGORIES ? "All" : selectedCategory}</p>
        </article>
      </section>

      {eventsResult === undefined ? (
        <div className="viewer-state">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">No events found for this filter.</div>
      ) : (
        <section className="event-grid">
          {events.map((eventItem) => {
            const badgeClass = getBadgeClass(eventItem.viewerRsvp);

            return (
              <article className="event-card" key={eventItem.id}>
                <div className="event-cover">
                  {eventItem.coverImageUrl ? (
                    <img alt={`${eventItem.title} cover`} src={eventItem.coverImageUrl} />
                  ) : null}
                </div>
                <div className="event-body">
                  <h2 className="event-title">{eventItem.title}</h2>
                  <p className="event-meta">
                    <span>{eventItem.category}</span>
                    <span>{eventItem.city}</span>
                    <span>{eventItem.attendeeCount} attendees</span>
                  </p>
                  <p className="event-meta">{formatEventWindow(eventItem.startAt, eventItem.endAt)}</p>
                  {eventItem.impactSummary ? (
                    <p className="event-summary">{eventItem.impactSummary}</p>
                  ) : (
                    <p className="event-summary">Hosted by {eventItem.organizer.displayName}</p>
                  )}
                  <div className="event-footer">
                    {badgeClass ? <span className={badgeClass}>{formatRsvpLabel(eventItem.viewerRsvp)}</span> : <span />}
                    <Link className="text-link" href={`/events/${eventItem.id}`}>
                      Event details
                    </Link>
                  </div>
                  <div className="rsvp-row">
                    {RSVP_OPTIONS.map((option) => {
                      const isActive = eventItem.viewerRsvp === option.value;
                      const buttonKey = `${eventItem.id}:${option.value}`;
                      return (
                        <button
                          key={option.value}
                          className={`rsvp-btn${isActive ? " rsvp-btn-active" : ""}`}
                          disabled={pendingKey === buttonKey}
                          onClick={() => void onRsvp(eventItem.id, option.value)}
                          type="button">
                          {pendingKey === buttonKey ? "Saving..." : option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
