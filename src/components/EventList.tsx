"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MapPin, Calendar, Users, Tag } from "lucide-react";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    time: string;
    location: {
        lat: number;
        lng: number;
        address?: string;
    };
    attendees: string[];
    maxAttendees?: number;
    createdBy: string;
}

interface EventListProps {
    limit?: number;
    showCreateButton?: boolean;
}

export default function EventList({ limit, showCreateButton = false }: EventListProps) {
    const { data: allEvents = [], isLoading: loading } = trpc.events.getAll.useQuery() as {
        data: Event[];
        isLoading: boolean;
    };

    // Sort by date and limit if specified
    const events = allEvents
        .sort((a: Event, b: Event) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .slice(0, limit);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="56" fill="#F6E8D6" stroke="#E1CFC2" strokeWidth="4" />
                    <ellipse cx="60" cy="80" rx="28" ry="8" fill="#E1CFC2" />
                    <path d="M40 60 Q60 80 80 60" stroke="currentColor" strokeWidth="3" fill="none" />
                    <circle cx="50" cy="54" r="4" fill="currentColor" />
                    <circle cx="70" cy="54" r="4" fill="currentColor" />
                </svg>
                <div className="mt-6 subtitle">
                    No events yet.
                    <br />
                    {showCreateButton ? "Create the first event!" : "Check back soon for upcoming events!"}
                </div>
                {showCreateButton && (
                    <Link href="/map">
                        <Button className="mt-4" variant="outline">Create Event</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-all duration-200 hover:-translate-y-[1px]">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg mb-2 line-clamp-2">{event.title}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(event.time)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {event.attendees.length}
                                        {event.maxAttendees && ` / ${event.maxAttendees}`}
                                    </div>
                                </div>
                            </div>
                            <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {event.category}
                                </div>
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-3 line-clamp-3">{event.description}</CardDescription>
                        {event.location.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                <MapPin className="h-4 w-4" />
                                {event.location.address}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Link href={`/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                    View Details
                                </Button>
                            </Link>
                            <Button size="sm">Join Event</Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
