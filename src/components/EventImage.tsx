'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, Users } from 'lucide-react';

interface EventImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
  fallbackIcon?: 'map' | 'calendar' | 'users';
  priority?: boolean;
}

export function EventImage({
  src,
  alt,
  className,
  aspectRatio = 'video',
  size = 'md',
  showFallback = true,
  fallbackIcon = 'calendar',
  priority = false,
}: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[2/1]',
  };

  const sizeClasses = {
    sm: 'h-24',
    md: 'h-40',
    lg: 'h-56',
    xl: 'h-72',
  };

  const iconComponents = {
    map: MapPin,
    calendar: Calendar,
    users: Users,
  };

  const IconComponent = iconComponents[fallbackIcon];

  const shouldShowFallback = !src || hasError;

  if (shouldShowFallback && showFallback) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center rounded-lg',
          aspectRatioClasses[aspectRatio],
          sizeClasses[size],
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs opacity-75">No image</p>
        </div>
      </div>
    );
  }

  if (shouldShowFallback && !showFallback) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        aspectRatioClasses[aspectRatio],
        sizeClasses[size],
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      
      <Image
        src={src!}
        alt={alt}
        fill
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

interface EventImageGalleryProps {
  images?: string[];
  alt: string;
  className?: string;
  maxImages?: number;
}

export function EventImageGallery({
  images = [],
  alt,
  className,
  maxImages = 4,
}: EventImageGalleryProps) {
  const visibleImages = images.slice(0, maxImages);
  const remainingCount = Math.max(0, images.length - maxImages);

  if (visibleImages.length === 0) {
    return (
      <EventImage
        src={null}
        alt={alt}
        className={className}
        showFallback={true}
      />
    );
  }

  if (visibleImages.length === 1) {
    return (
      <EventImage
        src={visibleImages[0]}
        alt={alt}
        className={className}
        priority={true}
      />
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      {visibleImages.length === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {visibleImages.map((src, index) => (
            <EventImage
              key={index}
              src={src}
              alt={`${alt} - Image ${index + 1}`}
              size="md"
              priority={index === 0}
            />
          ))}
        </div>
      )}

      {visibleImages.length === 3 && (
        <div className="grid grid-cols-3 gap-2">
          <EventImage
            src={visibleImages[0]}
            alt={`${alt} - Image 1`}
            size="md"
            priority={true}
          />
          <div className="grid grid-rows-2 gap-2">
            <EventImage
              src={visibleImages[1]}
              alt={`${alt} - Image 2`}
              size="sm"
              aspectRatio="square"
            />
            <EventImage
              src={visibleImages[2]}
              alt={`${alt} - Image 3`}
              size="sm"
              aspectRatio="square"
            />
          </div>
        </div>
      )}

      {visibleImages.length >= 4 && (
        <div className="grid grid-cols-2 gap-2">
          <EventImage
            src={visibleImages[0]}
            alt={`${alt} - Image 1`}
            size="md"
            priority={true}
          />
          <div className="grid grid-rows-2 gap-2">
            <EventImage
              src={visibleImages[1]}
              alt={`${alt} - Image 2`}
              size="sm"
              aspectRatio="video"
            />
            <div className="relative">
              <EventImage
                src={visibleImages[2]}
                alt={`${alt} - Image 3`}
                size="sm"
                aspectRatio="video"
              />
              {remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <span className="text-white font-semibold">
                    +{remainingCount} more
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}