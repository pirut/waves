"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Tag, 
  ArrowLeft, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  DollarSign, 
  AlertCircle,
  Share2,
  UserPlus,
  UserMinus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Event } from "@/types/event";
import { EventImageGallery } from "@/components/EventImage";
import { EventMapView } from "@/components/EventMapView";
import { format, parseISO, isPast } from "date-fns";
import { toast } from "sonner";

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const {
        data: event,
        isLoading: loading,
        error,
        refetch,
    } = trpc.events.getById.useQuery(
      { id: params.id as string }, 
      { enabled: !!params.id }
    ) as {
        data: Event | undefined;
        isLoading: boolean;
        error: Error | null;
        refetch: () => void;
    };

    const joinEventMutation = trpc.events.join.useMutation({
        onSuccess: () => {
            toast.success("Successfully joined the event!");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
        onSettled: () => {
            setIsJoining(false);
        },
    });

    const leaveEventMutation = trpc.events.leave.useMutation({
        onSuccess: () => {
            toast.success("Successfully left the event");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
        onSettled: () => {
            setIsLeaving(false);
        },
    });

    const formatEventDate = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        try {
            const date = parseISO(dateString);
            return format(date, 'EEEE, MMMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatEventTime = (dateString?: string) => {
        if (!dateString) return 'Time TBD';
        try {
            const date = parseISO(dateString);
            return format(date, 'h:mm a');
        } catch {
            return dateString;
        }
    };

    const formatEventDateTime = (dateString?: string) => {
        if (!dateString) return 'Date & Time TBD';
        try {
            const date = parseISO(dateString);
            return format(date, 'EEEE, MMMM d, yyyy • h:mm a');
        } catch {
            return dateString;
        }
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
            Technology: "bg-cyan-100 text-cyan-800",
            "Sports & Recreation": "bg-lime-100 text-lime-800",
        };
        return colors[category] || "bg-gray-100 text-gray-800";
    };

    const getEventStatus = () => {
        if (!event?.time) return null;
        
        try {
            const eventDate = parseISO(event.time);
            const now = new Date();
            
            if (isPast(eventDate)) {
                return { label: 'Past Event', color: 'bg-gray-100 text-gray-600', icon: Clock };
            }
            
            const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) {
                return { label: 'Today', color: 'bg-red-100 text-red-800', icon: AlertCircle };
            } else if (daysDiff === 1) {
                return { label: 'Tomorrow', color: 'bg-orange-100 text-orange-800', icon: Clock };
            } else if (daysDiff <= 7) {
                return { label: 'This Week', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
            }
            
            return { label: 'Upcoming', color: 'bg-green-100 text-green-800', icon: Clock };
        } catch {
            return null;
        }
    };

    const isUserAttending = event && user && event.attendees?.includes(user.uid);
    const canJoin = event && user && (!event.maxAttendees || (event.attendees?.length || 0) < event.maxAttendees);
    const isEventPast = event?.time ? isPast(parseISO(event.time)) : false;
    const isEventCreator = event && user && event.createdBy === user.uid;

    const handleJoinEvent = async () => {
        if (!event || !user) return;
        setIsJoining(true);
        joinEventMutation.mutate({ id: event.id });
    };

    const handleLeaveEvent = async () => {
        if (!event || !user) return;
        setIsLeaving(true);
        leaveEventMutation.mutate({ id: event.id });
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: event?.title || 'Event',
                text: event?.description || 'Check out this event!',
                url: window.location.href,
            });
        } catch {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success("Event link copied to clipboard!");
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-64 bg-muted rounded-lg"></div>
                            <div className="h-32 bg-muted rounded-lg"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-48 bg-muted rounded-lg"></div>
                            <div className="h-32 bg-muted rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button onClick={() => router.back()} variant="outline" className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
                        <p className="text-muted-foreground mb-4">
                            {error?.message || "The event you're looking for doesn't exist or has been removed."}
                        </p>
                        <Button onClick={() => router.push("/events")}>Browse Events</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const status = getEventStatus();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Button onClick={() => router.back()} variant="outline" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Event Header */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 mr-4">
                                    <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
                                    <div className="flex items-center gap-2 mb-4">
                                        {event.category && (
                                            <Badge className={getCategoryColor(event.category)}>
                                                <Tag className="h-4 w-4 mr-1" />
                                                {event.category}
                                            </Badge>
                                        )}
                                        {status && (
                                            <Badge variant="outline" className={status.color}>
                                                <status.icon className="h-4 w-4 mr-1" />
                                                {status.label}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="h-4 w-4 mr-1" />
                                    Share
                                </Button>
                            </div>

                            {/* Key Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">{formatEventDate(event.time)}</div>
                                        <div className="text-sm text-muted-foreground">{formatEventTime(event.time)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">
                                            {event.attendees?.length || 0} attending
                                        </div>
                                        {event.maxAttendees && (
                                            <div className="text-sm text-muted-foreground">
                                                {event.maxAttendees} max capacity
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {event.location?.address && (
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-medium">Location</div>
                                            <div className="text-sm text-muted-foreground">
                                                {event.location.address}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {event.cost && (
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">
                                                {event.cost.amount === 0 || !event.cost.amount ? 'Free' : `$${event.cost.amount}`}
                                            </div>
                                            {event.cost.description && (
                                                <div className="text-sm text-muted-foreground">
                                                    {event.cost.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {user ? (
                                    <>
                                        {isEventCreator ? (
                                            <Button variant="outline" disabled>
                                                You created this event
                                            </Button>
                                        ) : isUserAttending ? (
                                            <Button 
                                                variant="outline" 
                                                onClick={handleLeaveEvent}
                                                disabled={isLeaving || isEventPast}
                                            >
                                                <UserMinus className="h-4 w-4 mr-2" />
                                                {isLeaving ? 'Leaving...' : 'Leave Event'}
                                            </Button>
                                        ) : canJoin && !isEventPast ? (
                                            <Button 
                                                onClick={handleJoinEvent}
                                                disabled={isJoining}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                {isJoining ? 'Joining...' : 'Join Event'}
                                            </Button>
                                        ) : isEventPast ? (
                                            <Button disabled>
                                                Event has ended
                                            </Button>
                                        ) : (
                                            <Button disabled>
                                                Event is full
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button onClick={() => router.push("/login")}>
                                        Sign in to Join
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Event Images */}
                    {(event.coverImage || event.images?.length) && (
                        <Card>
                            <CardContent className="p-6">
                                <EventImageGallery
                                    images={event.images}
                                    alt={event.title || 'Event images'}
                                    maxImages={4}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabs for Details */}
                    <Card>
                        <CardContent className="p-6">
                            <Tabs defaultValue="description" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="description">Description</TabsTrigger>
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="attendees">Attendees</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="description" className="mt-4">
                                    {event.description ? (
                                        <div className="prose prose-sm max-w-none">
                                            <p className="whitespace-pre-wrap">{event.description}</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No description provided.</p>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="details" className="mt-4 space-y-4">
                                    {event.tags && event.tags.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {event.tags.map((tag, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {event.requirements && event.requirements.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">What to bring</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {event.requirements.map((req, index) => (
                                                    <li key={index} className="text-sm">{req}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {event.ageRestriction && (
                                        <div>
                                            <h4 className="font-medium mb-2">Age Requirement</h4>
                                            <p className="text-sm">
                                                {event.ageRestriction.min && event.ageRestriction.max
                                                    ? `Ages ${event.ageRestriction.min}-${event.ageRestriction.max}`
                                                    : event.ageRestriction.min
                                                    ? `${event.ageRestriction.min}+ years old`
                                                    : event.ageRestriction.max
                                                    ? `Under ${event.ageRestriction.max} years old`
                                                    : 'No age restriction'}
                                            </p>
                                        </div>
                                    )}

                                    {event.contactInfo && (
                                        <div>
                                            <h4 className="font-medium mb-2">Contact Information</h4>
                                            <div className="space-y-2">
                                                {event.contactInfo.email && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Mail className="h-4 w-4" />
                                                        <a href={`mailto:${event.contactInfo.email}`} className="text-blue-600 hover:underline">
                                                            {event.contactInfo.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {event.contactInfo.phone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="h-4 w-4" />
                                                        <a href={`tel:${event.contactInfo.phone}`} className="text-blue-600 hover:underline">
                                                            {event.contactInfo.phone}
                                                        </a>
                                                    </div>
                                                )}
                                                {event.contactInfo.website && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Globe className="h-4 w-4" />
                                                        <a href={event.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            Website
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="attendees" className="mt-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">
                                                {event.attendees?.length || 0} People Attending
                                            </h4>
                                            {event.maxAttendees && (
                                                <Badge variant="outline">
                                                    {event.attendees?.length || 0} / {event.maxAttendees}
                                                </Badge>
                                            )}
                                        </div>
                                        {event.attendees && event.attendees.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {event.attendees.map((attendeeId) => (
                                                    <div key={attendeeId} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>
                                                                {attendeeId.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">User {attendeeId.slice(0, 8)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No one has joined yet. Be the first!</p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Map */}
                    {event.location && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <EventMapView 
                                    event={event} 
                                    height="250px"
                                    className="rounded-b-lg"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Event Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Date & Time</span>
                                    <span className="text-sm font-medium text-right">
                                        {formatEventDateTime(event.time)}
                                    </span>
                                </div>
                                
                                <Separator />
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Attending</span>
                                    <span className="text-sm font-medium">
                                        {event.attendees?.length || 0}
                                        {event.maxAttendees && ` / ${event.maxAttendees}`}
                                    </span>
                                </div>
                                
                                {event.cost && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Cost</span>
                                            <span className="text-sm font-medium">
                                                {event.cost.amount === 0 || !event.cost.amount ? 'Free' : `$${event.cost.amount}`}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organizer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Organizer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>
                                        {event.createdBy?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">Event Organizer</div>
                                    <div className="text-sm text-muted-foreground">
                                        ID: {event.createdBy?.slice(0, 8)}...
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
