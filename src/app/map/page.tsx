"use client";
import MapView from "./MapView";

export default function MapPage() {
    return (
        <div className="flex-1 relative w-full h-full min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-7rem)]">
            <MapView />
        </div>
    );
}
