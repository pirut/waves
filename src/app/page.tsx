"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-5xl font-bold text-[#7F8C8D] tracking-tight">Make Waves</h1>
                <p className="text-lg text-[#7F8C8D] max-w-md text-center">
                    Discover, attend, and share real-world events focused on doing good. Every post is rooted in real-life impact.
                </p>
            </div>
            <Button className="w-full max-w-xs text-lg py-6" onClick={() => router.push("/map")} variant="default" size="lg">
                Find Events Near You
            </Button>
            <Button className="w-full max-w-xs flex items-center gap-2 text-lg py-6" variant="secondary" size="lg">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_17_40)">
                        <path
                            d="M47.5 24.5C47.5 22.8333 47.3333 21.1667 47 19.5833H24V28.9167H37.3333C36.6667 32.0833 34.6667 34.75 31.8333 36.5833V41.0833H39.5C44 37.0833 47.5 31.3333 47.5 24.5Z"
                            fill="#4285F4"
                        />
                        <path
                            d="M24 48C30.5 48 36.0833 45.9167 39.5 41.0833L31.8333 36.5833C29.9167 37.9167 27.5 38.75 24 38.75C17.8333 38.75 12.5 34.5833 10.6667 29.0833H2.83334V33.75C6.25 41.0833 14.5 48 24 48Z"
                            fill="#34A853"
                        />
                        <path
                            d="M10.6667 29.0833C10.1667 27.75 10 26.3333 10 24.9167C10 23.5 10.1667 22.0833 10.6667 20.75V16.0833H2.83334C1.5 18.75 0.75 21.75 0.75 24.9167C0.75 28.0833 1.5 31.0833 2.83334 33.75L10.6667 29.0833Z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M24 9.25C27.9167 9.25 31.0833 10.5833 33.25 12.5833L39.6667 6.16667C36.0833 2.91667 30.5 0.75 24 0.75C14.5 0.75 6.25 7.66667 2.83334 16.0833L10.6667 20.75C12.5 15.25 17.8333 9.25 24 9.25Z"
                            fill="#EA4335"
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_17_40">
                            <rect width="48" height="48" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
                Sign in with Google
            </Button>
        </div>
    );
}
