"use client";
import MapboxClient from "./MapboxClient";

export default function MapPage() {
    return (
        <div className="fixed inset-0 top-16 bottom-12 z-10">
            <MapboxClient />
        </div>
    );
}
