import { Card, CardContent } from "@/components/ui/card";

export default function Footer() {
    return (
        <Card className="w-full h-12 rounded-none shadow-none bg-white/80 backdrop-blur-md border-none">
            <CardContent className="flex items-center justify-center h-full p-0 text-xs text-[#7F8C8D]">
                &copy; {new Date().getFullYear()} Make Waves
            </CardContent>
        </Card>
    );
}
