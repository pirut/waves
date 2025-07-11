import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ModeToggle";

export default function Footer() {
    return (
        <Card className="w-full h-12 rounded-none shadow-none bg-background/80 backdrop-blur-md border-none text-foreground">
            <CardContent className="flex items-center justify-center h-full p-0 text-xs relative">
                <span className="mx-auto">&copy; {new Date().getFullYear()} Make Waves</span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ModeToggle />
                </div>
            </CardContent>
        </Card>
    );
}
