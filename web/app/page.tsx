"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const showClerkActions = isClerkConfigured && isLoaded && !isSignedIn;
  const showOpenApp = !isClerkConfigured || !isLoaded || isSignedIn;

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <p className="wordmark">Make Waves</p>
        {showClerkActions ? (
          <>
            <div className="hero-actions">
              <SignInButton mode="modal">
                <button className="btn btn-ghost" type="button">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-secondary" type="button">
                  Create account
                </button>
              </SignUpButton>
            </div>
          </>
        ) : null}
        {showOpenApp ? (
          <Link className="btn btn-secondary" href="/discover">
            Open app
          </Link>
        ) : null}
      </header>

      <main className="landing-main">
        <section className="hero-grid">
          <div className="hero-copy-block">
            <p className="hero-kicker">Dedicated Web Experience</p>
            <h1 className="hero-title">
              Website-grade interface.
              <br />
              Same live data as mobile.
            </h1>
            <p className="hero-copy">
              Your iOS and Android apps stay native. This web app is a separate frontend tuned for
              desktop browsing, readable density, and faster event discovery.
            </p>
            <div className="hero-actions">
              <Link className="btn" href="/discover">
                Explore events
              </Link>
              <Link className="btn btn-secondary" href="/feed">
                View feed
              </Link>
            </div>
          </div>
          <aside className="hero-panel">
            <p className="hero-panel-kicker">What changes on web</p>
            <ul className="hero-list">
              <li>Desktop-first navigation and information hierarchy</li>
              <li>Broader card layouts for event context at a glance</li>
              <li>Timeline feed made for scanning and rapid interaction</li>
              <li>No dependency on mobile tab patterns or mobile gestures</li>
            </ul>
          </aside>
        </section>

        <section className="feature-grid">
          <article className="feature-card">
            <p className="feature-label">Single backend</p>
            <h2>Convex shared across all clients</h2>
            <p>
              Discover, feed, RSVP, and profile data all come from your existing Convex tables and
              functions.
            </p>
          </article>
          <article className="feature-card">
            <p className="feature-label">Unified identity</p>
            <h2>Clerk session on web, iOS, and Android</h2>
            <p>
              One account model across platforms with profile sync handled once per signed-in user.
            </p>
          </article>
          <article className="feature-card">
            <p className="feature-label">Independent UX</p>
            <h2>Web can evolve faster</h2>
            <p>
              Separate frontend means web-specific iteration without degrading native app ergonomics.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
