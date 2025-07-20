"use client";
import ImprovedMapView from "./ImprovedMapView";

export default function MapPage() {
    return (
        <div className="flex-1 relative w-full h-full min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-7rem)]">
            <ImprovedMapView />
        </div>
    );
}
