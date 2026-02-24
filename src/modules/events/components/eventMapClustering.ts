import type { BBox } from "geojson";
import Supercluster from "supercluster";

import type { EventListItem } from "@/src/modules/events/domain/types";

type EventPointProperties = {
  event: EventListItem;
};

type ClusterInputFeature =
  | Supercluster.ClusterFeature<Supercluster.AnyProps>
  | Supercluster.PointFeature<EventPointProperties>;

export type EventClusterItem =
  | {
      kind: "cluster";
      id: string;
      clusterId: number;
      latitude: number;
      longitude: number;
      count: number;
    }
  | {
      kind: "event";
      id: string;
      latitude: number;
      longitude: number;
      event: EventListItem;
    };

export type EventClusterIndex = Supercluster<EventPointProperties, Supercluster.AnyProps>;

type ClusterItemsParams = {
  clusterIndex: EventClusterIndex | null;
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPointFeature(eventItem: EventListItem): Supercluster.PointFeature<EventPointProperties> {
  return {
    type: "Feature",
    properties: {
      event: eventItem,
    },
    geometry: {
      type: "Point",
      coordinates: [eventItem.longitude, eventItem.latitude],
    },
  };
}

function isClusterFeature(feature: ClusterInputFeature): feature is Supercluster.ClusterFeature<Supercluster.AnyProps> {
  return Boolean((feature.properties as { cluster?: boolean }).cluster);
}

function getBounds(west: number, south: number, east: number, north: number): BBox[] {
  const latSpan = Math.max(north - south, 0);
  const rawLngSpan = east >= west ? east - west : 360 - (west - east);
  const lngSpan = Math.max(rawLngSpan, 0);
  const latPadding = Math.max(latSpan * 0.2, 0.005);
  const lngPadding = Math.max(lngSpan * 0.2, 0.005);

  const clippedWest = clamp(west - lngPadding, -180, 180);
  const clippedEast = clamp(east + lngPadding, -180, 180);
  const clippedSouth = clamp(south - latPadding, -85, 85);
  const clippedNorth = clamp(north + latPadding, -85, 85);

  if (clippedWest <= clippedEast) {
    return [[clippedWest, clippedSouth, clippedEast, clippedNorth]];
  }

  return [
    [clippedWest, clippedSouth, 180, clippedNorth],
    [-180, clippedSouth, clippedEast, clippedNorth],
  ];
}

export function buildEventClusterIndex(events: EventListItem[]): EventClusterIndex | null {
  if (events.length === 0) {
    return null;
  }

  const index = new Supercluster<EventPointProperties, Supercluster.AnyProps>({
    minZoom: 0,
    maxZoom: 18,
    minPoints: 2,
    radius: 54,
    extent: 512,
  });

  index.load(events.map(toPointFeature));
  return index;
}

export function getEventClusterItems({
  clusterIndex,
  west,
  south,
  east,
  north,
  zoom,
}: ClusterItemsParams): EventClusterItem[] {
  if (!clusterIndex) {
    return [];
  }

  const normalizedZoom = clamp(Math.floor(zoom), 0, 18);
  const bounds = getBounds(west, south, east, north);
  const features = bounds.flatMap((bbox) =>
    clusterIndex.getClusters(bbox, normalizedZoom) as ClusterInputFeature[],
  );

  return features
    .map((feature): EventClusterItem | null => {
      const [longitude, latitude] = feature.geometry.coordinates;
      if (isClusterFeature(feature)) {
        return {
          kind: "cluster",
          id: `cluster:${feature.properties.cluster_id}`,
          clusterId: feature.properties.cluster_id,
          latitude,
          longitude,
          count: feature.properties.point_count,
        };
      }

      const eventItem = feature.properties.event;
      if (!eventItem) {
        return null;
      }

      return {
        kind: "event",
        id: eventItem.id,
        latitude,
        longitude,
        event: eventItem,
      };
    })
    .filter((item): item is EventClusterItem => Boolean(item))
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "cluster" ? -1 : 1;
      }

      if (a.kind === "cluster" && b.kind === "cluster") {
        return b.count - a.count;
      }

      return 0;
    });
}
