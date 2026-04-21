// mapStyle.tidepool.ts — Mapbox Style Specification JSON generated from the
// Tidepool palette. Used by both native (@rnmapbox/maps) and web (mapbox-gl),
// which both accept full GL JSON via `styleJSON` / `mapStyle` respectively.
//
// Uses the `mapbox.mapbox-streets-v8` vector source so we get real streets,
// parks, and water, then paints them with tokens from the palette.

import type { PaletteHex } from '@/theme/oklch';

export type GLStyle = {
  version: 8;
  name: string;
  sources: Record<string, { type: 'vector'; url: string }>;
  layers: Array<Record<string, unknown>>;
  sprite?: string;
  glyphs?: string;
};

export function tidepoolStyle(palette: PaletteHex): GLStyle {
  return {
    version: 8,
    name: 'Tidepool',
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {
      composite: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': palette.mapBg },
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'composite',
        'source-layer': 'landuse',
        paint: { 'fill-color': palette.mapLand },
      },
      {
        id: 'parks',
        type: 'fill',
        source: 'composite',
        'source-layer': 'landuse',
        filter: ['in', 'class', 'park', 'cemetery', 'pitch'],
        paint: { 'fill-color': palette.mapPark },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'composite',
        'source-layer': 'water',
        paint: { 'fill-color': palette.mapWater },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        paint: {
          'line-color': palette.mapRoadStroke,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 5],
        },
      },
      {
        id: 'road-fill',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        paint: {
          'line-color': palette.mapRoad,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 16, 3.5],
        },
      },
      {
        id: 'place-labels',
        type: 'symbol',
        source: 'composite',
        'source-layer': 'place_label',
        minzoom: 11,
        layout: {
          'text-field': ['get', 'name_en'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 13],
          'text-letter-spacing': 0.08,
          'text-transform': 'uppercase',
        },
        paint: {
          'text-color': palette.mapLabel,
          'text-halo-color': palette.mapBg,
          'text-halo-width': 1.2,
        },
      },
    ],
  };
}
