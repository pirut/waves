"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapView from "../MapView";
import ImprovedMapView from "../ImprovedMapView";

export default function MapTestPage() {
    const [currentView, setCurrentView] = useState<"original" | "improved">("improved");

    return (
        <div className="flex flex-col h-screen">
            {/* Header with toggle */}
            <div className="bg-background border-b p-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold">Map Comparison Test</h1>
                        <p className="text-muted-foreground">Compare the original vs improved map experience</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={currentView === "original" ? "default" : "outline"} onClick={() => setCurrentView("original")}>
                            Original Map
                        </Button>
                        <Button variant={currentView === "improved" ? "default" : "outline"} onClick={() => setCurrentView("improved")}>
                            Improved Map
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map container */}
            <div className="flex-1 relative min-h-0">
                <div className="w-full h-full">{currentView === "original" ? <MapView /> : <ImprovedMapView />}</div>
            </div>

            {/* Feature comparison */}
            <div className="bg-background border-t p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Original Map Issues</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="text-red-600">❌ Fixed center point (Miami only)</div>
                                <div className="text-red-600">❌ No search functionality</div>
                                <div className="text-red-600">❌ No user location detection</div>
                                <div className="text-red-600">❌ Overlay cards block interaction</div>
                                <div className="text-red-600">❌ No marker clustering</div>
                                <div className="text-red-600">❌ Small markers hard to tap</div>
                                <div className="text-red-600">❌ InfoWindow opens in new tab</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Improved Map Features</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="text-green-600">✅ Auto-detects user location</div>
                                <div className="text-green-600">✅ Search any location</div>
                                <div className="text-green-600">✅ "Go to my location" button</div>
                                <div className="text-green-600">✅ Clean interface, no blocking overlays</div>
                                <div className="text-yellow-600">🔄 Marker clustering (coming next)</div>
                                <div className="text-green-600">✅ Larger, easier-to-tap markers</div>
                                <div className="text-green-600">✅ Smooth in-app navigation</div>
                                <div className="text-green-600">✅ Loading states & error handling</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
