"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Calendar, Users } from "lucide-react";
import { createEvent } from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface CreateEventModalProps {
    onEventCreated?: () => void;
    defaultLocation?: { lat: number; lng: number };
}

const EVENT_CATEGORIES = [
    "Environmental",
    "Community Service",
    "Education",
    "Health & Wellness",
    "Arts & Culture",
    "Social Justice",
    "Animal Welfare",
    "Disaster Relief",
    "Youth Development",
    "Senior Support",
];

export default function CreateEventModal({ onEventCreated, defaultLocation }: CreateEventModalProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        date: "",
        time: "",
        location: {
            lat: defaultLocation?.lat || 25.79,
            lng: defaultLocation?.lng || -80.13,
            address: "",
        },
        maxAttendees: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const eventData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                time: new Date(`${formData.date}T${formData.time}`).toISOString(),
                location: formData.location,
                maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                attendees: [user.uid],
                status: "active",
            };

            await createEvent(eventData);

            // Reset form
            setFormData({
                title: "",
                description: "",
                category: "",
                date: "",
                time: "",
                location: {
                    lat: defaultLocation?.lat || 25.79,
                    lng: defaultLocation?.lng || -80.13,
                    address: "",
                },
                maxAttendees: "",
            });

            setOpen(false);
            onEventCreated?.();
        } catch (error) {
            console.error("Failed to create event:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateLocation = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                [field]: value,
            },
        }));
    };

    if (!user) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50" size="icon">
                    <Plus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Create New Event
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Event Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Beach Cleanup at South Beach"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Join us for a community beach cleanup to help protect our marine environment..."
                                rows={3}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date *
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                                min={new Date().toISOString().split("T")[0]}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="time">Time *</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                        </Label>

                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.location.address}
                                onChange={(e) => updateLocation("address", e.target.value)}
                                placeholder="123 Ocean Drive, Miami Beach, FL"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="number"
                                    step="any"
                                    value={formData.location.lat}
                                    onChange={(e) => updateLocation("lat", parseFloat(e.target.value) || 0)}
                                    placeholder="25.79"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                    id="lng"
                                    type="number"
                                    step="any"
                                    value={formData.location.lng}
                                    onChange={(e) => updateLocation("lng", parseFloat(e.target.value) || 0)}
                                    placeholder="-80.13"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div>
                        <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
                        <Input
                            id="maxAttendees"
                            type="number"
                            min="1"
                            value={formData.maxAttendees}
                            onChange={(e) => setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }))}
                            placeholder="Leave empty for unlimited"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.title || !formData.description || !formData.category || !formData.date || !formData.time}
                            className="flex-1"
                        >
                            {loading ? "Creating..." : "Create Event"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
