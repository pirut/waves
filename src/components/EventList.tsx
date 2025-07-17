"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/api";
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
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchEvents()
            .then((data) => {
                // Sort by date and limit if specified
                const sortedEvents = data.sort((a: Event, b: Event) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(0, limit);
                setEvents(sortedEvents);
            })
            .finally(() => setLoading(false));
    }, [limit]);

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

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            Environmental: "bg-green-100 text-green-800",
            "Community Service": "bg-blue-100 text-blue-800",
            Education: "bg-purple-100 text-purple-800",
            "Health & Wellness": "bg-pink-100 text-pink-800",
            "Arts & Culture": "bg-yellow-100 text-yellow-800",
            "Social Justice": "bg-orange-100 text-orange-800",
            "Animal Welfare": "bg-emerald-100 text-emerald-800",
            "Disaster Relief": "bg-red-100 text-red-800",
            "Youth Development": "bg-indigo-100 text-indigo-800",
            "Senior Support": "bg-violet-100 text-violet-800",
        };
        return colors[category] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 opacity-80">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="56" fill="#F6E8D6" stroke="#E1CFC2" strokeWidth="4" />
                    <ellipse cx="60" cy="80" rx="28" ry="8" fill="#E1CFC2" />
                    <path d="M40 60 Q60 80 80 60" stroke="currentColor" strokeWidth="3" fill="none" />
                    <circle cx="50" cy="54" r="4" fill="currentColor" />
                    <circle cx="70" cy="54" r="4" fill="currentColor" />
                </svg>
                <div className="mt-6 subtitle text-center">
                    No events yet.
                    <br />
                    {showCreateButton ? "Create the first event!" : "Check back soon for upcoming events!"}
                </div>
                {showCreateButton && (
                    <Link href="/map">
                        <Button className="mt-4">Create Event</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
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
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {event.category}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-3">{event.description}</CardDescription>
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
