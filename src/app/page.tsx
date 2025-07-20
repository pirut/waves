import { redirect } from "next/navigation";

export default function Home() {
    // Redirect to map page as the main entry point
    redirect("/map");
}
