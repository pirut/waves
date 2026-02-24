"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isClerkConfigured } from "@/lib/env";

const navItems = [
  { href: "/discover", label: "Discover" },
  { href: "/feed", label: "Feed" },
  { href: "/my-events", label: "My Events" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav">
      <div className="nav-links">
        <Link className="wordmark" href="/discover">
          Make Waves
        </Link>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={`nav-link${isActive ? " nav-link-active" : ""}`}
              href={item.href}>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="nav-right">
        <Link className="nav-link" href="/">
          Marketing
        </Link>
        {isClerkConfigured ? <UserButton afterSignOutUrl="/" /> : null}
      </div>
    </nav>
  );
}
