"use client";
import MapboxClient from "./MapboxClient";

export default function MapPage() {
    return (
        <div className="flex-1 relative w-full h-full min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-7rem)]">
            <MapboxClient />
        </div>
    );
}
