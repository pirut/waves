import React from "react";

const eventPins = [
    { id: 1, top: "30%", left: "40%", color: "#B3DFF2" },
    { id: 2, top: "60%", left: "70%", color: "#FFE5D4" },
    { id: 3, top: "50%", left: "20%", color: "#F6E8D6" },
];

export default function MapPage() {
    return (
        <div className="flex flex-col items-center min-h-screen py-8 px-4 gap-6">
            <h2 className="text-3xl font-bold text-[#7F8C8D] mb-2">Events Near You</h2>
            <div className="relative w-full max-w-xl h-[400px] bg-white rounded-3xl shadow-lg border border-[#B3DFF2] overflow-hidden">
                {/* Placeholder for map */}
                {eventPins.map((pin) => (
                    <div
                        key={pin.id}
                        className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg"
                        style={{ top: pin.top, left: pin.left, background: pin.color }}
                        title={`Event ${pin.id}`}
                    />
                ))}
                <div className="absolute bottom-4 right-4 bg-[#7F8C8D] text-white text-xs px-3 py-1 rounded-full opacity-80">Map Placeholder</div>
            </div>
        </div>
    );
}
