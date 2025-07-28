'use client';

import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  width: number;
  height: number;
  className?: string;
  text?: string;
}

export function PlaceholderImage({ width, height, className, text }: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        'bg-muted flex items-center justify-center text-muted-foreground text-sm',
        className
      )}
      style={{ width, height }}
    >
      {text || `${width}×${height}`}
    </div>
  );
}
