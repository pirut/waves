import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ModeToggle";

export default function Footer() {
    return (
        <Card className="w-full h-12 sm:h-14 rounded-none shadow-none bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 text-foreground">
            <CardContent className="flex items-center justify-between h-full px-4 sm:px-6 py-0 text-xs sm:text-sm">
                <span className="text-muted-foreground">&copy; {new Date().getFullYear()} Make Waves</span>
                <ModeToggle />
            </CardContent>
        </Card>
    );
}
