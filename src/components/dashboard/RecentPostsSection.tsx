'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { PlaceholderImage } from '@/components/ui/placeholder-image';

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  caption: string;
  eventName: string;
  eventLocation: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

interface RecentPostsSectionProps {
  posts: Post[];
}

export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const [showOnlyJoinedEvents, setShowOnlyJoinedEvents] = useState(false);

  // Mock data for demonstration
  const mockPosts: Post[] = [
    {
      id: '1',
      authorName: 'Jason Chen',
      authorAvatar: '',
      caption:
        'Had a great time today! Amazing turnout and such positive energy. Thanks to everyone who came out to support the cause.',
      eventName: "Luke's Fundraiser",
      eventLocation: 'Community Center',
      mediaUrl: 'placeholder',
      likes: 24,
      comments: 8,
      timestamp: '2 hours ago',
      isLiked: false,
    },
    {
      id: '2',
      authorName: 'Sarah Williams',
      authorAvatar: '',
      caption:
        "Can't wait for this! The preparation has been incredible and I know it's going to make a real difference.",
      eventName: 'Test Event 123',
      eventLocation: 'Downtown Park',
      likes: 15,
      comments: 3,
      timestamp: '4 hours ago',
      isLiked: true,
    },
    {
      id: '3',
      authorName: 'Michael Roberts',
      authorAvatar: '',
      caption:
        'Charity thumbs up! What an inspiring day. Seeing the community come together like this gives me so much hope.',
      eventName: 'Charity Birthday',
      eventLocation: 'City Hall',
      mediaUrl: 'placeholder',
      likes: 42,
      comments: 12,
      timestamp: '6 hours ago',
      isLiked: false,
    },
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  const PostCard = ({ post }: { post: Post }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);

    const handleLike = () => {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    };

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {/* Author info */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.authorAvatar} alt={post.authorName} />
              <AvatarFallback className="text-sm">
                {post.authorName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{post.authorName}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                <span>at {post.eventName}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{post.timestamp}</span>
          </div>

          {/* Post content */}
          <p className="text-sm mb-3 line-clamp-3">{post.caption}</p>

          {/* Media */}
          {post.mediaUrl && (
            <div className="mb-3 rounded-lg overflow-hidden">
              {post.mediaUrl === 'placeholder' ? (
                <PlaceholderImage
                  width={400}
                  height={192}
                  className="w-full h-48 rounded-lg"
                  text="Event Photo"
                />
              ) : (
                <Image
                  src={post.mediaUrl}
                  alt="Post media"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              )}
            </div>
          )}

          {/* Event tag */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {post.eventLocation}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">{post.comments}</span>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Posts by Friends</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-posts" className="text-sm">
            Only Events I Joined
          </Label>
          <Switch
            id="filter-posts"
            checked={showOnlyJoinedEvents}
            onCheckedChange={setShowOnlyJoinedEvents}
          />
        </div>
      </CardHeader>
      <CardContent>
        {displayPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm mb-4">Connect with friends and attend events to see posts here</p>
            <Button onClick={() => (window.location.href = '/friends')}>Find Friends</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {displayPosts.length > 3 && (
              <Button variant="outline" className="w-full mt-4">
                Load More Posts
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
