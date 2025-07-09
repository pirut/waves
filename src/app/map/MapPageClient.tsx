"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPageClient() {
    return (
        <div className="flex flex-col flex-1 h-full min-h-0 w-full">
            <h2 className="text-3xl font-bold text-[#7F8C8D] mb-2 text-center">Events Near You</h2>
            <div className="flex-1 h-full min-h-0 w-full">
                <MapView />
            </div>
        </div>
    );
}
