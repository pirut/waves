"use client";
import Map, { Marker, ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Style as MapboxStyle } from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

const pastelMapStyle = {
    version: 8,
    sources: {
        "raster-tiles": {
            type: "raster",
            tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [
        {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
            minzoom: 0,
            maxzoom: 22,
        },
    ],
    background: {
        color: "#FFE5D4",
    },
};

const eventMarkers = [
    { id: 1, lat: 25.792, lng: -80.13, color: "#B3DFF2" },
    { id: 2, lat: 25.789, lng: -80.132, color: "#FFE5D4" },
    { id: 3, lat: 25.791, lng: -80.128, color: "#F6E8D6" },
];

export default function MapView() {
    const [zoom, setZoom] = useState(2);

    const onMove = useCallback((evt: ViewStateChangeEvent) => {
        setZoom(evt.viewState.zoom);
    }, []);

    const showCard = zoom <= 5;

    return (
        <div className="flex w-full h-full transition-all duration-700">
            {/* Info Card */}
            <div
                className={`h-full flex-shrink-0 flex-grow-0 transition-all duration-700 ${
                    showCard ? "basis-[30%] opacity-100" : "basis-0 opacity-0 pointer-events-none"
                }`}
            >
                <Card className="h-full m-8 bg-white/90 backdrop-blur-md shadow-xl border-none flex flex-col justify-center">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-[#7F8C8D]">Welcome to Make Waves</h3>
                        <p className="text-[#7F8C8D] mb-2">
                            Zoom in to explore events around the world. This info card will hide as you get closer to the action!
                        </p>
                        <ul className="text-sm text-[#7F8C8D]">
                            <li>🌊 3 events near Miami Beach</li>
                            <li>🗺️ Drag, zoom, and explore</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            {/* Map Area */}
            <div className={`h-full transition-all duration-700 min-w-0 ${showCard ? "basis-[70%] flex-grow" : "w-full flex-grow"}`}>
                <Map
                    initialViewState={{
                        longitude: -80.13,
                        latitude: 25.79,
                        zoom: 2,
                        pitch: 0,
                        bearing: 0,
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
                    mapStyle={pastelMapStyle as MapboxStyle}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection={{ name: "globe" }}
                    attributionControl={true}
                    onMove={onMove}
                >
                    {eventMarkers.map((marker) => (
                        <Marker key={marker.id} longitude={marker.lng} latitude={marker.lat} anchor="center">
                            <div
                                style={{
                                    width: 18,
                                    height: 18,
                                    background: marker.color,
                                    borderRadius: "50%",
                                    border: "2px solid #7F8C8D",
                                    boxShadow: "0 2px 8px #0002",
                                }}
                            />
                        </Marker>
                    ))}
                </Map>
            </div>
        </div>
    );
}
