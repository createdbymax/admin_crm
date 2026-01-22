import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.isAdmin ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Help & Best Practices
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Lost Hills CRM Guide
        </h1>
        <p className="text-muted-foreground">
          Everything you need to know to effectively manage artist outreach and
          track releases.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-white/70 bg-white p-6 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] sm:p-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Getting Started</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Lost Hills CRM is your central hub for managing artist
              relationships and tracking release schedules. The system
              integrates with Spotify to automatically enrich artist profiles
              with up-to-date data.
            </p>
            <div className="rounded-lg border border-white/70 bg-white/50 p-4">
              <p className="font-semibold text-foreground">Quick Navigation</p>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/artists"
                    className="text-primary hover:underline"
                  >
                    Artists
                  </Link>{" "}
                  - Browse and manage your artist database
                </li>
                <li>
                  <Link
                    href="/calendar"
                    className="text-primary hover:underline"
                  >
                    Calendar
                  </Link>{" "}
                  - View upcoming releases by date
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Artist Management</h2>
          
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              📧 Need help finding artist contact information?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check out our comprehensive guide on finding emails and contact
              details across Instagram, YouTube, Facebook, and more.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/help/finding-contacts">
                View Contact Research Guide →
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Understanding Artist Status
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Each artist moves through a pipeline. Keep statuses updated to
                  track progress:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                    <Badge variant="secondary" className="mb-1">
                      LEAD
                    </Badge>
                    <p className="text-xs">
                      New artist, not yet contacted. Research and prepare
                      outreach.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                    <Badge variant="secondary" className="mb-1">
                      CONTACTED
                    </Badge>
                    <p className="text-xs">
                      Initial outreach sent. Awaiting response or follow-up.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                    <Badge variant="secondary" className="mb-1">
                      NEGOTIATING
                    </Badge>
                    <p className="text-xs">
                      Active discussions. Terms, timelines, or deals in
                      progress.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                    <Badge variant="secondary" className="mb-1">
                      WON
                    </Badge>
                    <p className="text-xs">
                      Deal closed successfully. Artist is now a partner.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                    <Badge variant="secondary" className="mb-1">
                      LOST
                    </Badge>
                    <p className="text-xs">
                      Opportunity closed without success. Document why for
                      future reference.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Searching & Filtering
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use the powerful filtering system to find exactly what you need:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    <strong>Search bar:</strong> Find artists by name instantly
                  </li>
                  <li>
                    <strong>Status filter:</strong> Focus on specific pipeline
                    stages
                  </li>
                  <li>
                    <strong>Contact filter:</strong> Find artists with email,
                    Instagram, or other contact info
                  </li>
                  <li>
                    <strong>Owner filter:</strong> See your assigned artists or
                    find unassigned leads
                  </li>
                  <li>
                    <strong>Tag filter:</strong> Group artists by custom
                    categories
                  </li>
                  <li>
                    <strong>Sort options:</strong> Order by listeners,
                    followers, popularity, or date
                  </li>
                </ul>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    💡 Pro Tip
                  </p>
                  <p className="mt-1 text-xs">
                    Click "Filters" to show/hide advanced options. Use "Reset"
                    to clear all filters at once.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Syncing Spotify Data
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Keep artist profiles fresh with the latest Spotify metrics:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Click <strong>"Sync"</strong> on any artist row to update
                    their data
                  </li>
                  <li>
                    Syncing fetches: monthly listeners, followers, popularity
                    score, genres, and latest release
                  </li>
                  <li>
                    Select multiple artists and use bulk <strong>"Sync"</strong>{" "}
                    to update many at once
                  </li>
                  <li>
                    Sync regularly before outreach to ensure you have current
                    numbers
                  </li>
                </ul>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    ⚠️ Rate Limits
                  </p>
                  <p className="mt-1 text-xs">
                    Spotify has rate limits. If syncing fails, wait a few
                    minutes and try again.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Bulk Actions
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Save time by updating multiple artists at once:</p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>
                    Check the boxes next to artists you want to update
                  </li>
                  <li>
                    A toolbar appears showing how many are selected
                  </li>
                  <li>
                    Use the <strong>"Sync"</strong> button to update Spotify
                    data for all selected artists
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Artist Detail Pages
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Click any artist name or the <strong>"View"</strong> button to
                  see their full profile:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    View complete Spotify stats, genres, and release history
                  </li>
                  <li>
                    See all contact information in one place
                  </li>
                  <li>
                    Update status, owner, and add custom tags
                  </li>
                  <li>
                    Add notes if helpful for team context
                  </li>
                  <li>
                    Quick links to Spotify, Instagram, and artist websites
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Release Calendar</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Tracking Upcoming Releases
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The calendar view helps you stay on top of artist release
                  schedules:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Navigate months using <strong>"Prev"</strong> and{" "}
                    <strong>"Next"</strong> buttons
                  </li>
                  <li>
                    Each day shows a count of releases and preview cards
                  </li>
                  <li>
                    Click any day to see full details of all releases
                  </li>
                  <li>
                    Click artist names to jump to their profile
                  </li>
                  <li>
                    Today's date is highlighted for quick reference
                  </li>
                </ul>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    📅 Planning Tip
                  </p>
                  <p className="mt-1 text-xs">
                    Check the calendar weekly to plan outreach around release
                    dates. Artists are most engaged near launches.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Release Data Sources
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Release information comes from Spotify when you sync artist
                  profiles:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Latest release data updates each time you sync an artist
                  </li>
                  <li>
                    Includes release name, type (album/single/EP), and date
                  </li>
                  <li>
                    Direct links to listen on Spotify
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Best Practices</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Daily Workflow Recommendations
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ol className="list-inside list-decimal space-y-2 pl-2">
                  <li>
                    <strong>Start your day:</strong> Check the calendar for
                    releases this week
                  </li>
                  <li>
                    <strong>Review your artists:</strong> Filter by your name in
                    the Owner dropdown
                  </li>
                  <li>
                    <strong>Update statuses:</strong> Move artists through the
                    pipeline as conversations progress
                  </li>
                  <li>
                    <strong>Sync before outreach:</strong> Always refresh
                    Spotify data before contacting artists
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Data Quality Tips
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Keep contact information up to date - add emails and social
                    links when you find them
                  </li>
                  <li>
                    Use tags to categorize artists by genre, priority, or
                    campaign
                  </li>
                  <li>
                    Sync Spotify data at least once a month to keep metrics
                    current
                  </li>
                  <li>
                    Update status immediately after each touchpoint
                  </li>
                  <li>
                    If an artist is unresponsive, mark as LOST with a note
                    explaining why
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Outreach Strategy
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    <strong>Research first:</strong> Check Spotify stats,
                    genres, and recent releases before reaching out
                  </li>
                  <li>
                    <strong>Personalize:</strong> Reference specific songs or
                    achievements in your message
                  </li>
                  <li>
                    <strong>Timing matters:</strong> Contact artists 2-4 weeks
                    before or after major releases
                  </li>
                  <li>
                    <strong>Follow up:</strong> If no response in 1 week, send a
                    polite follow-up
                  </li>
                  <li>
                    <strong>Add notes (optional):</strong> Quick notes help
                    teammates stay in the loop
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Team Collaboration
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Check if an artist is assigned before reaching out
                  </li>
                  <li>
                    Use the Owner filter to see who's working with which artists
                  </li>
                  <li>
                    Add detailed notes so teammates can pick up where you left
                    off
                  </li>
                  <li>
                    Communicate with your team about high-priority leads
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Common Issues
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="font-semibold text-foreground">
                    Spotify sync fails
                  </p>
                  <p className="mt-1 text-xs">
                    Wait 2-3 minutes and try again. If it continues failing,
                    check that the artist has a valid Spotify URL.
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="font-semibold text-foreground">
                    Can't see an artist
                  </p>
                  <p className="mt-1 text-xs">
                    Check your filters - you might have status, owner, or tag
                    filters active. Click "Reset" to clear all filters.
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="font-semibold text-foreground">
                    Changes not saving
                  </p>
                  <p className="mt-1 text-xs">
                    Refresh the page and try again. If the issue persists,
                    contact your administrator.
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="font-semibold text-foreground">
                    Missing release data
                  </p>
                  <p className="mt-1 text-xs">
                    Release information comes from Spotify. Sync the artist
                    profile to fetch their latest release.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Need More Help?</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you have questions not covered in this guide:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Contact your team lead or administrator
              </li>
              <li>
                Check with colleagues who have used the system longer
              </li>
              <li>
                Document any bugs or feature requests for the development team
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="flex justify-center pb-8">
        <Button asChild size="lg">
          <Link href="/artists">Get Started with Artists</Link>
        </Button>
      </div>
    </div>
  );
}
