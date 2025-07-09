"use client";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPageClient() {
    return (
        <div className="flex flex-col flex-1 h-full min-h-0 w-full relative">
            <h2 className="text-3xl font-bold text-[#7F8C8D] mb-2 text-center">Events Near You</h2>
            <Card className="flex-1 h-full min-h-0 w-full bg-white/80 backdrop-blur-md border-none shadow-none">
                <CardContent className="flex-1 h-full min-h-0 w-full p-0">
                    <MapView />
                </CardContent>
            </Card>
            {/* Floating Action Button (future) */}
            <Button className="fixed bottom-20 right-8 rounded-full shadow-lg" size="icon" variant="default" aria-label="Create Event">
                <Plus className="w-6 h-6" />
            </Button>
        </div>
    );
}
