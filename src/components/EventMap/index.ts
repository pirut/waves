// EventMap/index.ts — platform-split entrypoint. Metro picks `.native.tsx`
// on iOS/Android and `.web.tsx` on web; the `.d.ts` provides the single
// shared type for TS consumers.

export { EventMap } from './EventMap';
export type { EventMapMarker, EventMapProps } from './EventMap.types';
