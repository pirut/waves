// EventMap.d.ts — shared declaration for both platform variants so TS doesn't
// complain when we import from the non-extension path.

import type { ComponentType } from 'react';
import type { EventMapProps } from './EventMap.types';

export const EventMap: ComponentType<EventMapProps>;
export type { EventMapProps, EventMapMarker } from './EventMap.types';
