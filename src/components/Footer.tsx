import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ModeToggle";

export default function Footer() {
    return (
        <Card className="w-full h-10 sm:h-12 rounded-none shadow-none bg-background/95 backdrop-blur-md border-none text-foreground border-t border-border/50">
            <CardContent className="flex items-center justify-between h-full px-3 sm:px-4 py-0 text-xs">
                <span>&copy; {new Date().getFullYear()} Make Waves</span>
                <ModeToggle />
            </CardContent>
        </Card>
    );
}
