"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPageClient() {
    return (
        <div className="flex flex-col items-center min-h-screen h-screen flex-1 w-full">
            <h2 className="text-3xl font-bold text-[#7F8C8D] mb-2">Events Near You</h2>
            <div className="w-full max-w-xl flex-1 flex min-h-0">
                <MapView />
            </div>
        </div>
    );
}
