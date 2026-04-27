export const WEST_PALM_BEACH = {
  name: 'West Palm Beach',
  region: 'Palm Beach County',
  lat: 26.7153,
  lng: -80.0534,
  zoom: 11.8,
} as const;

export type WpbLandmark = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export const WPB_LANDMARKS: WpbLandmark[] = [
  {
    id: 'currie-park',
    name: 'Currie Park',
    address: '2400 N Flagler Dr, West Palm Beach, FL',
    lat: 26.7385,
    lng: -80.0489,
  },
  {
    id: 'clematis-st',
    name: 'Clematis Street',
    address: 'Clematis St & Rosemary Ave, West Palm Beach, FL',
    lat: 26.7117,
    lng: -80.0537,
  },
  {
    id: 'lake-trail',
    name: 'Lake Trail (Lake Worth Lagoon)',
    address: 'Flagler Dr Trail, West Palm Beach, FL',
    lat: 26.7203,
    lng: -80.046,
  },
  {
    id: 'dreher-park',
    name: 'Dreher Park',
    address: '1500 N Parker Ave, West Palm Beach, FL',
    lat: 26.6852,
    lng: -80.071,
  },
  {
    id: 'howard-park',
    name: 'Howard Park',
    address: '1302 Parker Ave, West Palm Beach, FL',
    lat: 26.7008,
    lng: -80.069,
  },
  {
    id: 'rosemary-square',
    name: 'Rosemary Square',
    address: '700 S Rosemary Ave, West Palm Beach, FL',
    lat: 26.7066,
    lng: -80.0566,
  },
];

export function mapsUrl({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const query = encodeURIComponent(label ? `${label} ${lat},${lng}` : `${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
