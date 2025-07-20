"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Calendar, Users, Search, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

interface CreateEventModalProps {
    onEventCreated?: () => void;
    defaultLocation?: { lat: number; lng: number };
    children?: React.ReactNode;
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

export default function CreateEventModal({ onEventCreated, defaultLocation, children }: CreateEventModalProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "success" | "error">("idle");
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

    const createEventMutation = trpc.events.create.useMutation({
        onSuccess: () => {
            onEventCreated?.();
            setOpen(false);
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
        },
        onError: (error) => {
            console.error("Failed to create event:", error);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const eventData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            date: new Date(`${formData.date}T${formData.time}`).toISOString(),
            location: {
                lat: formData.location.lat,
                lng: formData.location.lng,
            },
            maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        };

        createEventMutation.mutate(eventData);
    };

    // Geocoding function using our server-side API
    const geocodeAddress = async (address: string) => {
        if (!address.trim()) return;

        setGeocoding(true);
        setGeocodeStatus("idle");

        try {
            const response = await fetch("/api/geocode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ address }),
            });

            const data = await response.json();

            if (data.success) {
                setFormData((prev) => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        lat: data.lat,
                        lng: data.lng,
                        address: data.formatted_address,
                    },
                }));

                setGeocodeStatus("success");
            } else {
                setGeocodeStatus("error");
                console.error("Geocoding failed:", data.error);
            }
        } catch (error) {
            setGeocodeStatus("error");
            console.error("Geocoding error:", error);
        } finally {
            setGeocoding(false);
        }
    };

    const handleAddressChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                address: value,
            },
        }));

        // Reset geocode status when user types
        if (geocodeStatus !== "idle") {
            setGeocodeStatus("idle");
        }
    };

    const handleGeocodeClick = () => {
        if (formData.location.address.trim()) {
            geocodeAddress(formData.location.address);
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
                {children || (
                    <Button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50 bg-[#FFE5D4] hover:bg-[#F6E8D6] text-gray-900" size="icon">
                        <Plus className="h-6 w-6" />
                    </Button>
                )}
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
                            Location *
                        </Label>

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="address">Event Address</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="address"
                                        value={formData.location.address}
                                        onChange={(e) => handleAddressChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleGeocodeClick();
                                            }
                                        }}
                                        placeholder="Enter full address (e.g., 123 Ocean Drive, Miami Beach, FL 33139)"
                                        className="flex-1"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleGeocodeClick}
                                        disabled={geocoding || !formData.location.address.trim()}
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                    >
                                        {geocoding ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Geocoding Status */}
                                {geocodeStatus === "success" && (
                                    <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Location found and coordinates updated!
                                    </div>
                                )}
                                {geocodeStatus === "error" && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Could not find this address. Please check and try again.
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter the full address and click the search button to automatically set coordinates
                                </p>
                            </div>

                            {/* Coordinates - now read-only and auto-populated */}
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
                                        className="bg-muted/50"
                                        readOnly={geocodeStatus === "success"}
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
                                        className="bg-muted/50"
                                        readOnly={geocodeStatus === "success"}
                                    />
                                </div>
                            </div>

                            {geocodeStatus === "success" && (
                                <p className="text-xs text-muted-foreground">
                                    Coordinates were automatically set from the address. You can manually adjust them if needed.
                                </p>
                            )}

                            {/* Location Preview - Simple static map for now */}
                            {geocodeStatus === "success" && (
                                <div className="mt-4">
                                    <Label>Location Preview</Label>
                                    <div className="border rounded-lg overflow-hidden h-48 bg-gray-100 flex items-center justify-center">
                                        <div className="text-center text-muted-foreground">
                                            <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            <p className="font-medium">{formData.title || "Event Location"}</p>
                                            <p className="text-sm">{formData.location.address}</p>
                                            <p className="text-xs mt-1">
                                                📍 {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">This is where your event will appear on the map</p>
                                </div>
                            )}
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
                            disabled={
                                createEventMutation.isPending ||
                                !formData.title ||
                                !formData.description ||
                                !formData.category ||
                                !formData.date ||
                                !formData.time ||
                                !formData.location.address ||
                                geocoding
                            }
                            className="flex-1"
                        >
                            {createEventMutation.isPending ? "Creating..." : geocoding ? "Finding Location..." : "Create Event"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
