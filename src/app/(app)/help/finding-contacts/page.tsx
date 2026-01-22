import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FindingContactsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <Link
          href="/help"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Help
        </Link>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Contact Research Guide
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Finding Artist Contact Information
        </h1>
        <p className="text-muted-foreground">
          A comprehensive guide to discovering email addresses and contact
          methods for artist outreach.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-white/70 bg-white p-6 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] sm:p-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Overview</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Finding accurate contact information is crucial for successful
              artist outreach. This guide covers proven methods to locate email
              addresses and other contact details across various platforms.
            </p>
            <div className="rounded-lg border border-white/70 bg-white/50 p-4">
              <p className="font-semibold text-foreground">
                💡 General Strategy
              </p>
              <p className="mt-2">
                Always check multiple sources. Artists often list different
                contact methods on different platforms. Start with the most
                direct sources (official websites, Instagram) and work your way
                through secondary sources.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Instagram</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Mobile App Contact Button
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The Instagram mobile app often reveals contact information
                  that's hidden on desktop:
                </p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>Open the artist's Instagram profile in the mobile app</li>
                  <li>
                    Look for a <strong>"Contact"</strong> button below the bio
                    (between the Follow button and message button)
                  </li>
                  <li>
                    Tap it to reveal email address, phone number, or business
                    address
                  </li>
                  <li>
                    If no Contact button appears, they haven't added business
                    contact info
                  </li>
                </ol>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    📱 Pro Tip
                  </p>
                  <p className="mt-1 text-xs">
                    Business and Creator accounts are more likely to have the
                    Contact button. Personal accounts typically don't show this
                    option.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Bio Section</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Check the artist's bio for:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Email addresses written directly (e.g.,
                    "booking@artistname.com")
                  </li>
                  <li>
                    Email in emoji format (e.g., "📧 contact@email.com")
                  </li>
                  <li>
                    Links to Linktree, Beacons, or similar link aggregators
                  </li>
                  <li>Management or booking agency mentions</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Story Highlights</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Artists sometimes save contact info in story highlights:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Look for highlights labeled "Contact," "Booking," "Info," or
                    "Business"
                  </li>
                  <li>Check slides for email addresses or contact forms</li>
                  <li>
                    Some artists include management contact details here
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">YouTube</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">About Page</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  YouTube's About page is a goldmine for contact information:
                </p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>Navigate to the artist's YouTube channel</li>
                  <li>
                    Click the <strong>"About"</strong> tab
                  </li>
                  <li>
                    Scroll to the <strong>"Details"</strong> section
                  </li>
                  <li>
                    Look for "Business email" or "View email address" button
                  </li>
                  <li>Click to reveal the email address</li>
                </ol>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    ✅ High Success Rate
                  </p>
                  <p className="mt-1 text-xs">
                    Many artists and their management teams keep YouTube contact
                    info updated since it's a primary platform for business
                    inquiries.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Channel Description
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Check the channel description for:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Email addresses in the description text</li>
                  <li>Links to official websites or press kits</li>
                  <li>Management company information</li>
                  <li>Social media links that might have contact info</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Video Descriptions</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Sometimes contact info appears in individual video
                  descriptions:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Check recent music video descriptions</li>
                  <li>
                    Look for "For business inquiries" or "Booking" sections
                  </li>
                  <li>Official releases often include management contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Facebook</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">About Section</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Facebook pages often contain detailed contact information:</p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>Visit the artist's Facebook page</li>
                  <li>
                    Click <strong>"About"</strong> in the left sidebar
                  </li>
                  <li>
                    Look under "Contact Information" or "General Information"
                  </li>
                  <li>Check for email, phone, or website links</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Page Transparency</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Facebook's transparency features can reveal contact info:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Scroll to the bottom of the page and click "Page
                    Transparency"
                  </li>
                  <li>
                    View "People Who Manage This Page" for potential contacts
                  </li>
                  <li>Check the page history for contact information changes</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Pinned Posts</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Artists sometimes pin important posts with contact details:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Check pinned posts at the top of the page</li>
                  <li>Look for booking announcements or press releases</li>
                  <li>Tour announcements often include management contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Official Websites</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Contact/Press Pages
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Artist websites are the most reliable source:</p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>
                    Look for "Contact," "Press," "Booking," or "Management" in
                    the navigation
                  </li>
                  <li>Check the footer for contact links or email addresses</li>
                  <li>
                    Look for "Media Kit" or "EPK" (Electronic Press Kit) pages
                  </li>
                  <li>
                    Some sites have dedicated booking or business inquiry forms
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">About/Bio Pages</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Biography pages often include:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Management company names and contacts</li>
                  <li>Publicist or PR agency information</li>
                  <li>Booking agent details</li>
                  <li>General inquiry email addresses</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Domain WHOIS Lookup
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  If the website doesn't list contact info, try a WHOIS lookup:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Use a WHOIS lookup service (whois.com, who.is, etc.)</li>
                  <li>
                    Search for the artist's domain name (e.g., artistname.com)
                  </li>
                  <li>
                    Check registrant contact information (may be privacy
                    protected)
                  </li>
                  <li>
                    Look for administrative or technical contact emails
                  </li>
                </ul>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    ⚠️ Note
                  </p>
                  <p className="mt-1 text-xs">
                    Many domains use privacy protection services that hide
                    contact details. This method works best for older domains or
                    those without privacy protection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Spotify</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Artist Profile</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>While Spotify doesn't show emails directly, check for:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Links to artist websites, Instagram, Facebook, and Twitter
                    in the "About" section
                  </li>
                  <li>
                    Follow these links to find contact information on those
                    platforms
                  </li>
                  <li>
                    Check if the artist has a verified profile (blue checkmark)
                    - verified artists often have updated social links
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Record Label Information
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use Spotify to identify the artist's label:</p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>Click on any album or single</li>
                  <li>
                    Scroll down to see the record label and copyright
                    information
                  </li>
                  <li>
                    Search for the label's website and contact their A&R or
                    artist relations team
                  </li>
                  <li>
                    Independent artists often list their own contact info on
                    their label page
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Twitter/X</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Profile Bio</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Check the artist's Twitter/X profile for:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Email addresses in the bio</li>
                  <li>Links to Linktree or other contact aggregators</li>
                  <li>Website links that may contain contact pages</li>
                  <li>Management or booking mentions</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Pinned Tweets</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Artists sometimes pin tweets with important information:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Check pinned tweets for contact details</li>
                  <li>Look for booking announcements</li>
                  <li>Press release tweets often include PR contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">TikTok</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Profile Bio</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>TikTok profiles can contain contact information:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Check the bio for email addresses</li>
                  <li>
                    Look for links to Instagram, YouTube, or other platforms
                  </li>
                  <li>Business accounts may have a contact button</li>
                  <li>Check for Linktree or similar link aggregators</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Link Aggregators (Linktree, Beacons, etc.)
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                What to Look For
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Many artists use link aggregator services. When you find one:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Look for "Contact," "Booking," or "Business" buttons
                  </li>
                  <li>Check for email addresses listed directly</li>
                  <li>
                    Follow links to press kits or media pages
                  </li>
                  <li>
                    Some aggregators have built-in contact forms
                  </li>
                  <li>
                    Check all social media links - one might have contact info
                    the others don't
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Music Industry Databases
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Professional Resources
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Consider using industry databases if other methods fail:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    <strong>AllMusic:</strong> Artist biographies sometimes
                    include management info
                  </li>
                  <li>
                    <strong>Discogs:</strong> Check artist profiles and label
                    information
                  </li>
                  <li>
                    <strong>Bandcamp:</strong> Independent artists often list
                    contact info
                  </li>
                  <li>
                    <strong>SoundCloud:</strong> Check profile descriptions and
                    track descriptions
                  </li>
                  <li>
                    <strong>LinkedIn:</strong> Search for the artist or their
                    management team
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Advanced Techniques</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Email Pattern Guessing
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  If you know the artist's website domain, try common email
                  patterns:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>info@artistdomain.com</li>
                  <li>contact@artistdomain.com</li>
                  <li>booking@artistdomain.com</li>
                  <li>management@artistdomain.com</li>
                  <li>press@artistdomain.com</li>
                  <li>hello@artistdomain.com</li>
                </ul>
                <div className="mt-3 rounded-lg border border-white/70 bg-white/50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    ⚠️ Use Responsibly
                  </p>
                  <p className="mt-1 text-xs">
                    Only use guessed emails if you can't find official contact
                    information. Always verify the email is correct before
                    sending important messages.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Google Search Operators
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use advanced Google searches to find contact information:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                      "artist name" email
                    </code>{" "}
                    - Basic search
                  </li>
                  <li>
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                      "artist name" contact booking
                    </code>{" "}
                    - Find booking info
                  </li>
                  <li>
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                      site:artistwebsite.com contact
                    </code>{" "}
                    - Search specific site
                  </li>
                  <li>
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                      "artist name" "@gmail.com" OR "@yahoo.com"
                    </code>{" "}
                    - Find public emails
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Press Releases & News Articles
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Search for recent press coverage:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Google the artist's name + "press release"
                  </li>
                  <li>
                    Press releases often include PR contact information at the
                    bottom
                  </li>
                  <li>
                    Check music blogs and news sites for contact credits
                  </li>
                  <li>
                    Tour announcements frequently list booking agent details
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Management & Label Research
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Find the artist's representation:
                </p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>
                    Search "[artist name] management" or "[artist name] booking
                    agent"
                  </li>
                  <li>
                    Check the artist's Wikipedia page for management information
                  </li>
                  <li>
                    Look up the management company or agency website
                  </li>
                  <li>
                    Contact the company's general inquiry email with your
                    request
                  </li>
                  <li>
                    Ask to be directed to the appropriate contact for the artist
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Best Practices</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Research Workflow
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Follow this order for maximum efficiency:</p>
                <ol className="list-inside list-decimal space-y-1 pl-2">
                  <li>
                    <strong>Start with Instagram mobile app</strong> - Check
                    for Contact button
                  </li>
                  <li>
                    <strong>Check YouTube About page</strong> - High success
                    rate for business emails
                  </li>
                  <li>
                    <strong>Visit official website</strong> - Look for
                    Contact/Press pages
                  </li>
                  <li>
                    <strong>Check Facebook About section</strong> - Often has
                    detailed contact info
                  </li>
                  <li>
                    <strong>Review all social media bios</strong> - Twitter,
                    TikTok, etc.
                  </li>
                  <li>
                    <strong>Try link aggregators</strong> - Linktree, Beacons,
                    etc.
                  </li>
                  <li>
                    <strong>Use advanced techniques</strong> - Google searches,
                    management research
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Verification Tips
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Before using a contact method:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Verify the email looks legitimate (not spam or fake)
                  </li>
                  <li>
                    Check if it's listed on multiple platforms (more reliable)
                  </li>
                  <li>
                    Look for official verification badges on social accounts
                  </li>
                  <li>
                    Cross-reference with management or label information
                  </li>
                  <li>
                    When in doubt, start with a polite inquiry to confirm you
                    have the right contact
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                What to Document
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>When you find contact information, add it to the CRM:</p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Email addresses (primary contact method)
                  </li>
                  <li>
                    Instagram handle (for DM outreach if email fails)
                  </li>
                  <li>
                    Official website URL
                  </li>
                  <li>
                    Management or booking agency names (helpful context)
                  </li>
                  <li>
                    Where you found the contact info (helps verify legitimacy)
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Time-Saving Tips
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Use multiple browser tabs to check several sources
                    simultaneously
                  </li>
                  <li>
                    Keep a checklist of platforms to review for each artist
                  </li>
                  <li>
                    Start with the highest-success platforms (Instagram mobile,
                    YouTube)
                  </li>
                  <li>
                    If you find one contact method, still check other sources -
                    you might find better options
                  </li>
                  <li>
                    Set a time limit (5-10 minutes per artist) to stay efficient
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Common Pitfalls</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-white/70 bg-white/50 p-3">
              <p className="font-semibold text-foreground">
                ❌ Outdated Information
              </p>
              <p className="mt-1 text-xs">
                Artists change management, labels, and contact info. Always
                check multiple recent sources and verify before reaching out.
              </p>
            </div>
            <div className="rounded-lg border border-white/70 bg-white/50 p-3">
              <p className="font-semibold text-foreground">
                ❌ Fan Email Addresses
              </p>
              <p className="mt-1 text-xs">
                Some emails are for fan mail only, not business inquiries. Look
                for "booking," "management," or "business" designations.
              </p>
            </div>
            <div className="rounded-lg border border-white/70 bg-white/50 p-3">
              <p className="font-semibold text-foreground">
                ❌ Fake or Impersonator Accounts
              </p>
              <p className="mt-1 text-xs">
                Verify accounts are official (check for verification badges,
                follower counts, and post history) before using contact
                information.
              </p>
            </div>
            <div className="rounded-lg border border-white/70 bg-white/50 p-3">
              <p className="font-semibold text-foreground">
                ❌ Giving Up Too Soon
              </p>
              <p className="mt-1 text-xs">
                If you don't find contact info on the first platform, keep
                checking. Many artists have contact details on less obvious
                platforms.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">When You Can't Find Contact Info</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you've exhausted all options:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Try reaching out via Instagram DM (professional and brief)
              </li>
              <li>
                Contact their record label or management company
              </li>
              <li>
                Check if they have a contact form on their website
              </li>
              <li>
                Look for their booking agent through industry directories
              </li>
              <li>
                Mark the artist as "no contact found" in the CRM and revisit
                later
              </li>
              <li>
                Some artists intentionally keep contact info private - respect
                that
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="flex justify-center gap-3 pb-8">
        <Button asChild variant="outline">
          <Link href="/help">Back to Help</Link>
        </Button>
        <Button asChild>
          <Link href="/artists">Start Researching</Link>
        </Button>
      </div>
    </div>
  );
}
