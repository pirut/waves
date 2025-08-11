'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Edit, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>You need to be logged in to view this page.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback>{user.displayName?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{user.displayName || 'User'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member since</span>
                  <span>
                    {user.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Events attended</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Events created</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="events">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events">My Events</TabsTrigger>
              <TabsTrigger value="attending">Attending</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Events</CardTitle>
                  <CardDescription>Events you have created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No events created yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t created any events yet. Create your first event to get
                      started.
                    </p>
                    <Button>Create an Event</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="attending" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attending</CardTitle>
                  <CardDescription>Events you are attending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Not attending any events</h3>
                    <p className="text-muted-foreground mb-4">
                      You&apos;re not attending any events yet. Find events to attend.
                    </p>
                    <Button>Find Events</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                  <CardDescription>Your recent activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                      <MapPin className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You don&apos;t have any activity yet. Start by attending or creating events.
                    </p>
                    <Button>Explore Events</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
