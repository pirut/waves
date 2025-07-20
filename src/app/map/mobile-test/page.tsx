"use client";
import ImprovedMapView from "../ImprovedMapView";

export default function MobileMapTestPage() {
    return (
        <div className="h-screen w-full">
            {/* Full screen map for mobile testing */}
            <ImprovedMapView />

            {/* Mobile test instructions overlay */}
            <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none">
                <div className="bg-blue-500 text-white p-2 rounded text-xs text-center pointer-events-auto">
                    📱 Mobile Test Mode - Try tapping markers, zooming, and searching!
                </div>
            </div>
        </div>
    );
}
