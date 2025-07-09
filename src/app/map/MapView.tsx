"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "1.5rem",
};

const center = {
    lat: 25.790654,
    lng: -80.1300455,
};

const eventMarkers = [
    { id: 1, position: { lat: 25.792, lng: -80.13 }, color: "#B3DFF2" },
    { id: 2, position: { lat: 25.789, lng: -80.132 }, color: "#FFE5D4" },
    { id: 3, position: { lat: 25.791, lng: -80.128 }, color: "#F6E8D6" },
];

const mapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    mapTypeId: "satellite",
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative", stylers: [{ visibility: "off" }] },
        { featureType: "water", stylers: [{ color: "#B3DFF2" }] },
        { elementType: "geometry", stylers: [{ color: "#F6E8D6" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#7F8C8D" }] },
    ],
};

// SVG path for a circle (as a Google Maps marker icon)
const CIRCLE_PATH = "M 0,0 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0";

export default function MapView() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
    });

    if (loadError) return <div className="text-center py-8 text-red-600">Failed to load map: {String(loadError)}</div>;
    if (!isLoaded) return <div className="text-center py-8">Loading map...</div>;

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14} options={mapOptions} mapTypeId="satellite">
            {eventMarkers.map((marker) => (
                <Marker
                    key={marker.id}
                    position={marker.position}
                    icon={{
                        path: CIRCLE_PATH,
                        scale: 1,
                        fillColor: marker.color,
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#7F8C8D",
                    }}
                />
            ))}
        </GoogleMap>
    );
}
