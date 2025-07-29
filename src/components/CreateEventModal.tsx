'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { UploadButton } from '@/lib/uploadthing';
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag,
  UserCheck,
  Image as ImageIcon,
  X,
  DollarSign,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_CATEGORIES, type CreateEventInput } from '@/types/event';
import { toast } from 'sonner';

interface CreateEventModalProps {
  onEventCreated?: () => void;
  defaultLocation?: { lat: number; lng: number };
}

export default function CreateEventModal({
  onEventCreated,
  defaultLocation,
}: CreateEventModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: undefined as Date | undefined,
    time: '',
    location: {
      lat: defaultLocation?.lat || 25.79,
      lng: defaultLocation?.lng || -80.13,
      address: '',
    },
    maxAttendees: '',
    images: [] as string[],
    coverImage: '',
    tags: [] as string[],
    isPrivate: false,
    contactInfo: {
      email: '',
      phone: '',
      website: '',
    },
    requirements: [] as string[],
    ageRestriction: {
      min: '',
      max: '',
    },
    cost: {
      amount: '',
      currency: 'USD',
      description: '',
    },
    duration: {
      hours: '',
      minutes: '',
    },
  });

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Event created successfully!');
      onEventCreated?.();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      date: undefined,
      time: '',
      location: {
        lat: defaultLocation?.lat || 25.79,
        lng: defaultLocation?.lng || -80.13,
        address: '',
      },
      maxAttendees: '',
      images: [],
      coverImage: '',
      tags: [],
      isPrivate: false,
      contactInfo: {
        email: '',
        phone: '',
        website: '',
      },
      requirements: [],
      ageRestriction: {
        min: '',
        max: '',
      },
      cost: {
        amount: '',
        currency: 'USD',
        description: '',
      },
      duration: {
        hours: '',
        minutes: '',
      },
    });
    setTagInput('');
    setRequirementInput('');
    setGeocodeStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.date) {
      toast.error('Please select an event date');
      return;
    }

    // Combine date and time
    const eventDateTime = new Date(formData.date);
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    // Prepare event data according to CreateEventInput interface
    const eventData: CreateEventInput = {
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      time: eventDateTime.toISOString(),
      location: {
        lat: formData.location.lat,
        lng: formData.location.lng,
        address: formData.location.address || undefined,
      },
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      coverImage: formData.coverImage || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      isPrivate: formData.isPrivate || undefined,
      contactInfo: (formData.contactInfo.email || formData.contactInfo.phone || formData.contactInfo.website) ? {
        email: formData.contactInfo.email || undefined,
        phone: formData.contactInfo.phone || undefined,
        website: formData.contactInfo.website || undefined,
      } : undefined,
      requirements: formData.requirements.length > 0 ? formData.requirements : undefined,
      ageRestriction: (formData.ageRestriction.min || formData.ageRestriction.max) ? {
        min: formData.ageRestriction.min ? parseInt(formData.ageRestriction.min) : undefined,
        max: formData.ageRestriction.max ? parseInt(formData.ageRestriction.max) : undefined,
      } : undefined,
      cost: (formData.cost.amount || formData.cost.description) ? {
        amount: formData.cost.amount ? parseFloat(formData.cost.amount) : undefined,
        currency: formData.cost.currency,
        description: formData.cost.description || undefined,
      } : undefined,
      duration: (formData.duration.hours || formData.duration.minutes) ? {
        hours: formData.duration.hours ? parseInt(formData.duration.hours) : undefined,
        minutes: formData.duration.minutes ? parseInt(formData.duration.minutes) : undefined,
      } : undefined,
    };

    createEventMutation.mutate(eventData);
  };

  // Geocoding function using our server-side API
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;

    setGeocoding(true);
    setGeocodeStatus('idle');

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('error');
        toast.error('Could not find this address. Please check and try again.');
      }
    } catch (error) {
      setGeocodeStatus('error');
      toast.error('Error finding location. Please try again.');
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

    if (geocodeStatus !== 'idle') {
      setGeocodeStatus('idle');
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addRequirement = () => {
    if (requirementInput.trim() && !formData.requirements.includes(requirementInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput('');
    }
  };

  const removeRequirement = (reqToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== reqToRemove),
    }));
  };

  const removeImage = (imageToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove),
      coverImage: prev.coverImage === imageToRemove ? '' : prev.coverImage,
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Event
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create an event to make waves in your community
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details" className="flex items-center gap-1 text-xs">
                <Tag className="h-3 w-3" />
                Details
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                Location
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-1 text-xs">
                <ImageIcon className="h-3 w-3" />
                Media
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                More
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Event Information
                  </CardTitle>
                  <CardDescription>Tell people what your event is about</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Join us for a community beach cleanup to help protect our marine environment..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
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

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-1"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, isPrivate: checked as boolean }))
                      }
                    />
                    <Label htmlFor="isPrivate" className="text-sm">
                      Private event (invite-only)
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </CardTitle>
                  <CardDescription>When will your event take place?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date *
                      </Label>
                      <DatePicker
                        date={formData.date}
                        onDateChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                        placeholder="Select event date"
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time *
                      </Label>
                      <TimePicker
                        time={formData.time}
                        onTimeChange={(time) =>
                          setFormData((prev) => ({ ...prev, time: time || '' }))
                        }
                        placeholder="Select event time"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration-hours">Duration (Hours)</Label>
                      <Input
                        id="duration-hours"
                        type="number"
                        min="0"
                        max="24"
                        value={formData.duration.hours}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duration: { ...prev.duration, hours: e.target.value },
                          }))
                        }
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration-minutes">Duration (Minutes)</Label>
                      <Input
                        id="duration-minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={formData.duration.minutes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duration: { ...prev.duration, minutes: e.target.value },
                          }))
                        }
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="maxAttendees" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Max Attendees (optional)
                    </Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min="1"
                      value={formData.maxAttendees}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }))
                      }
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Event Location
                  </CardTitle>
                  <CardDescription>Where will your event take place?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Event Address *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        value={formData.location.address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
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
                    {geocodeStatus === 'success' && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4" />
                        Location found and coordinates updated!
                      </div>
                    )}
                    {geocodeStatus === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <AlertCircle className="h-4 w-4" />
                        Could not find this address. Please check and try again.
                      </div>
                    )}
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.location.lat}
                        onChange={(e) => updateLocation('lat', parseFloat(e.target.value) || 0)}
                        placeholder="25.79"
                        className="bg-muted/50"
                        readOnly={geocodeStatus === 'success'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.location.lng}
                        onChange={(e) => updateLocation('lng', parseFloat(e.target.value) || 0)}
                        placeholder="-80.13"
                        className="bg-muted/50"
                        readOnly={geocodeStatus === 'success'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Event Images
                  </CardTitle>
                  <CardDescription>
                    Add photos to make your event more appealing (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Upload Images</Label>
                    <div className="mt-2">
                      <UploadButton
                        endpoint="eventImageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            const newImages = res.map(file => file.url);
                            setFormData((prev) => ({
                              ...prev,
                              images: [...prev.images, ...newImages],
                              coverImage: prev.coverImage || newImages[0],
                            }));
                            toast.success('Images uploaded successfully!');
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Upload failed: ${error.message}`);
                        }}
                        onUploadBegin={() => {
                          setUploading(true);
                        }}
                        onUploadComplete={() => {
                          setUploading(false);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum 5 images, 4MB each. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>

                  {formData.images.length > 0 && (
                    <div>
                      <Label>Uploaded Images</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Event image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(image)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {formData.coverImage === image && (
                              <Badge className="absolute bottom-1 left-1 text-xs">Cover</Badge>
                            )}
                            {formData.coverImage !== image && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-1 left-1 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, coverImage: image }))
                                }
                              >
                                Set Cover
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost & Requirements
                  </CardTitle>
                  <CardDescription>Additional event details (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost-amount">Cost ($)</Label>
                      <Input
                        id="cost-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, amount: e.target.value },
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost-description">Cost Description</Label>
                      <Input
                        id="cost-description"
                        value={formData.cost.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, description: e.target.value },
                          }))
                        }
                        placeholder="Suggested donation, includes lunch, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age-min">Minimum Age</Label>
                      <Input
                        id="age-min"
                        type="number"
                        min="0"
                        max="120"
                        value={formData.ageRestriction.min}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            ageRestriction: { ...prev.ageRestriction, min: e.target.value },
                          }))
                        }
                        placeholder="18"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age-max">Maximum Age</Label>
                      <Input
                        id="age-max"
                        type="number"
                        min="0"
                        max="120"
                        value={formData.ageRestriction.max}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            ageRestriction: { ...prev.ageRestriction, max: e.target.value },
                          }))
                        }
                        placeholder="65"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>What to bring/Requirements</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={requirementInput}
                        onChange={(e) => setRequirementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRequirement();
                          }
                        }}
                        placeholder="Water bottle, sunscreen, etc."
                        className="flex-1"
                      />
                      <Button type="button" onClick={addRequirement} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                    {formData.requirements.length > 0 && (
                      <ul className="space-y-1">
                        {formData.requirements.map((req, index) => (
                          <li key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm">{req}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequirement(req)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>How can attendees reach you? (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contact-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, email: e.target.value },
                        }))
                      }
                      placeholder="organizer@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, phone: e.target.value },
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </Label>
                    <Input
                      id="contact-website"
                      type="url"
                      value={formData.contactInfo.website}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, website: e.target.value },
                        }))
                      }
                      placeholder="https://myorganization.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* Submit Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
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
                geocoding ||
                uploading
              }
              className="flex-1"
            >
              {createEventMutation.isPending
                ? 'Creating...'
                : uploading
                  ? 'Uploading Images...'
                  : geocoding
                    ? 'Finding Location...'
                    : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
