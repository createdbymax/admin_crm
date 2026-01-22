"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
};

type ArtistDetailProps = {
  artist: {
    id: string;
    name: string;
    status: string;
    ownerId: string | null;
    spotifyUrl: string | null;
    spotifyFollowers: number | null;
    spotifyPopularity: number | null;
    spotifyGenres: string[];
    spotifyImage: string | null;
    spotifyLatestReleaseName: string | null;
    spotifyLatestReleaseDate: string | null;
    spotifyLatestReleaseUrl: string | null;
    spotifyLatestReleaseImage: string | null;
    spotifyLastSyncedAt: string | null;
    monthlyListeners: number | null;
    email: string | null;
    instagram: string | null;
    website: string | null;
    campaignNotes: string | null;
    nextStepAt: string | null;
    nextStepNote: string | null;
    reminderAt: string | null;
    lastContactedAt: string | null;
    wonReason: string | null;
    lostReason: string | null;
    contactName: string | null;
    contactRole: string | null;
    contactNotes: string | null;
  };
  tags: Array<{ id: string; name: string }>;
  users: UserOption[];
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    detail: string | null;
    createdAt: string;
    author: string | null;
  }>;
  outboundMessages: Array<{
    id: string;
    channel: string;
    subject: string | null;
    body: string | null;
    template: string | null;
    sentAt: string;
    author: string | null;
  }>;
  stageHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    createdAt: string;
    author: string | null;
  }>;
  shouldAutoSync: boolean;
  isAdmin: boolean;
};

const statusOptions = [
  "LEAD",
  "CONTACTED",
  "NEGOTIATING",
  "WON",
  "LOST",
];

const activityOptions = ["Email", "DM", "Call", "Meeting", "Campaign Sent"];
const outboundTemplates = [
  {
    name: "Intro",
    subject: "Quick intro from Lost Hills",
    body: "Hi there,\\n\\nWanted to introduce myself from Lost Hills and share a few campaign ideas. Let me know if you have time to chat this week.\\n\\nThanks,",
  },
  {
    name: "Follow-up",
    subject: "Following up on our outreach",
    body: "Hi there,\\n\\nJust checking in on the previous note. Happy to share specifics on timing, budgets, and next steps.\\n\\nThanks,",
  },
];

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDateInput(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function ArtistDetail({
  artist,
  tags,
  users,
  notes,
  activities,
  outboundMessages,
  stageHistory,
  shouldAutoSync,
  isAdmin,
}: ArtistDetailProps) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState(artist.ownerId ?? "");
  const [status, setStatus] = useState(artist.status);
  const [note, setNote] = useState("");
  const [campaignNotes, setCampaignNotes] = useState(
    artist.campaignNotes ?? "",
  );
  const [nextStepNote, setNextStepNote] = useState(
    artist.nextStepNote ?? "",
  );
  const [nextStepAt, setNextStepAt] = useState(
    formatDateInput(artist.nextStepAt),
  );
  const [reminderAt, setReminderAt] = useState(
    formatDateInput(artist.reminderAt),
  );
  const [contactName, setContactName] = useState(artist.contactName ?? "");
  const [contactRole, setContactRole] = useState(artist.contactRole ?? "");
  const [contactEmails, setContactEmails] = useState(artist.email ?? "");
  const [contactInstagram, setContactInstagram] = useState(
    artist.instagram ?? "",
  );
  const [contactWebsite, setContactWebsite] = useState(artist.website ?? "");
  const [contactNotes, setContactNotes] = useState(artist.contactNotes ?? "");
  const [tagItems, setTagItems] = useState(tags);
  const [tagInput, setTagInput] = useState(
    tags.map((tagItem) => tagItem.name).join(", "),
  );
  const [statusReason, setStatusReason] = useState(() => {
    if (artist.status === "WON") {
      return artist.wonReason ?? "";
    }
    if (artist.status === "LOST") {
      return artist.lostReason ?? "";
    }
    return "";
  });
  const [outboundSubject, setOutboundSubject] = useState("");
  const [outboundBody, setOutboundBody] = useState("");
  const [outboundTemplate, setOutboundTemplate] = useState("");
  const [outboundSentAt, setOutboundSentAt] = useState(
    formatDateInput(new Date().toISOString()),
  );
  const [outboundLog, setOutboundLog] = useState(outboundMessages);
  const [outboundStatus, setOutboundStatus] = useState<string | null>(null);
  const [outboundSaving, setOutboundSaving] = useState(false);
  const [lastContactedAt, setLastContactedAt] = useState(
    artist.lastContactedAt,
  );
  const [activityType, setActivityType] = useState(activityOptions[0]);
  const [activityDetail, setActivityDetail] = useState("");
  const [syncing, setSyncing] = useState(false);

  const ownerLabel = useMemo(() => {
    const user = users.find((item) => item.id === ownerId);
    return user?.name ?? user?.email ?? "Unassigned";
  }, [ownerId, users]);

  useEffect(() => {
    if (!shouldAutoSync) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    
    fetch("/api/spotify/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId: artist.id }),
    })
      .then(() => {
        if (!cancelled) {
          router.refresh();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [artist.id, router, shouldAutoSync]);

  useEffect(() => {
    if (status === "WON") {
      setStatusReason(artist.wonReason ?? "");
      return;
    }
    if (status === "LOST") {
      setStatusReason(artist.lostReason ?? "");
      return;
    }
    setStatusReason("");
  }, [artist.lostReason, artist.wonReason, status]);

  useEffect(() => {
    setTagItems(tags);
    setTagInput(tags.map((tagItem) => tagItem.name).join(", "));
  }, [tags]);

  useEffect(() => {
    setOutboundLog(outboundMessages);
  }, [outboundMessages]);

  useEffect(() => {
    setLastContactedAt(artist.lastContactedAt);
  }, [artist.lastContactedAt]);

  const handleAssign = async () => {
    await fetch(`/api/artists/${artist.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: ownerId || null }),
    });
    router.refresh();
  };

  const handleStatus = async () => {
    await fetch(`/api/artists/${artist.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason: status === "WON" || status === "LOST" ? statusReason : null,
      }),
    });
    router.refresh();
  };

  const handleCrmUpdate = async () => {
    await fetch(`/api/artists/${artist.id}/crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignNotes: campaignNotes.trim() || null,
        nextStepNote: nextStepNote.trim() || null,
        nextStepAt: nextStepAt ? `${nextStepAt}T00:00:00.000Z` : null,
        reminderAt: reminderAt ? `${reminderAt}T00:00:00.000Z` : null,
      }),
    });
    router.refresh();
  };

  const handleContactUpdate = async () => {
    await fetch(`/api/artists/${artist.id}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName,
        contactRole,
        email: contactEmails,
        instagram: contactInstagram,
        website: contactWebsite,
        contactNotes,
      }),
    });
    router.refresh();
  };

  const handleTagsUpdate = async () => {
    const response = await fetch(`/api/artists/${artist.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: tagInput }),
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as {
      tags: Array<{ id: string; name: string }>;
    };
    setTagItems(data.tags);
    setTagInput(data.tags.map((tagItem) => tagItem.name).join(", "));
    router.refresh();
  };

  const handleOutboundLog = async () => {
    if (!outboundSubject.trim() && !outboundBody.trim()) {
      setOutboundStatus("Add a subject or message before logging.");
      return;
    }
    setOutboundSaving(true);
    setOutboundStatus(null);
    try {
      const response = await fetch(`/api/artists/${artist.id}/outbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: outboundSubject.trim() || null,
          body: outboundBody.trim() || null,
          template: outboundTemplate || null,
          sentAt: outboundSentAt
            ? `${outboundSentAt}T00:00:00.000Z`
            : null,
        }),
      });
      const data = (await response.json()) as {
        message?: {
          id: string;
          channel: string;
          subject: string | null;
          body: string | null;
          template: string | null;
          sentAt: string;
        };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to log message.");
      }
      if (data.message) {
        const newMessage: ArtistDetailProps["outboundMessages"][number] = {
          id: data.message.id,
          channel: data.message.channel,
          subject: data.message.subject ?? null,
          body: data.message.body ?? null,
          template: data.message.template ?? null,
          sentAt: data.message.sentAt,
          author: null,
        };
        setOutboundLog((prev) => [
          newMessage,
          ...prev,
        ]);
        setLastContactedAt(data.message.sentAt);
      }
      setOutboundSubject("");
      setOutboundBody("");
      setOutboundTemplate("");
      setOutboundStatus("Outbound message logged.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log message.";
      setOutboundStatus(message);
    } finally {
      setOutboundSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      return;
    }
    await fetch(`/api/artists/${artist.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note.trim() }),
    });
    setNote("");
    router.refresh();
  };

  const handleAddActivity = async () => {
    await fetch(`/api/artists/${artist.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activityType,
        detail: activityDetail.trim() || null,
      }),
    });
    setActivityDetail("");
    router.refresh();
  };

  const handleSync = async () => {
    console.log('=== SYNC BUTTON CLICKED ===');
    console.log('Artist ID:', artist.id);
    
    setSyncing(true);
    
    try {
      // Use absolute URL to work around Turbopack routing bug
      const url = `${window.location.origin}/api/spotify/refresh`;
      const payload = { artistId: artist.id };
      
      console.log('Making fetch request to:', url);
      console.log('Payload:', payload);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }
      
      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
      alert(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this artist? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }
    await fetch(`/api/artists/${artist.id}`, { method: "DELETE" });
    router.push("/artists");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Artist
        </p>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-semibold">{artist.name}</h2>
        <Badge variant="secondary">{artist.status}</Badge>
        <Badge variant="outline">Owner: {ownerLabel}</Badge>
        {isAdmin ? (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete artist
          </Button>
        ) : null}
      </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spotify + contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {artist.monthlyListeners !== null ? (
                  <Badge variant="secondary">
                    {numberFormatter.format(artist.monthlyListeners)} listeners
                  </Badge>
                ) : null}
                {artist.spotifyFollowers !== null ? (
                  <Badge variant="outline">
                    {numberFormatter.format(artist.spotifyFollowers)} followers
                  </Badge>
                ) : null}
                {artist.spotifyPopularity !== null ? (
                  <Badge variant="outline">
                    Popularity {artist.spotifyPopularity}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  Synced{" "}
                  {artist.spotifyLastSyncedAt
                    ? new Date(artist.spotifyLastSyncedAt).toLocaleDateString(
                        "en-US",
                      )
                    : "Never"}
                </Badge>
                {lastContactedAt ? (
                  <Badge variant="outline">
                    Last contacted{" "}
                    {new Date(lastContactedAt).toLocaleDateString("en-US")}
                  </Badge>
                ) : null}
              </div>
              {artist.spotifyLatestReleaseName ? (
                <div className="rounded-lg border border-white/70 bg-white/80 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                    Latest Release
                  </p>
                  <div className="flex gap-4">
                    {artist.spotifyLatestReleaseImage ? (
                      <img
                        src={artist.spotifyLatestReleaseImage}
                        alt={artist.spotifyLatestReleaseName}
                        className="h-24 w-24 rounded-lg object-cover shadow-md shrink-0"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0 space-y-2">
                      <a
                        className="text-base font-semibold text-primary hover:underline block truncate"
                        href={artist.spotifyLatestReleaseUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {artist.spotifyLatestReleaseName}
                      </a>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {artist.spotifyLatestReleaseDate ? (
                          <span>
                            {new Date(
                              artist.spotifyLatestReleaseDate,
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : null}
                      </div>
                      {artist.spotifyLatestReleaseUrl ? (
                        <a
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          href={artist.spotifyLatestReleaseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Listen on Spotify
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/70 bg-white/50 p-4 text-sm text-muted-foreground">
                  Sync Spotify to pull latest release info.
                </div>
              )}
              <Separator />
              <div className="grid gap-3 text-sm">
                {artist.spotifyUrl ? (
                  <a
                    className="text-primary hover:underline"
                    href={artist.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Artist on Spotify
                  </a>
                ) : null}
                {artist.email ? <div>Email: {artist.email}</div> : null}
                {artist.instagram ? (
                  <a
                    className="text-primary hover:underline"
                    href={artist.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                ) : null}
                {artist.website ? (
                  <a
                    className="text-primary hover:underline"
                    href={artist.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? "Syncing..." : "Sync Spotify"}
                </Button>
                {syncing && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    This may take 30-60 seconds...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-white/80 p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Add a note about outreach, next steps, or context..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <Button onClick={handleAddNote}>Save note</Button>
              <Separator />
              <div className="space-y-4 text-sm">
                {notes.length ? (
                  notes.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {item.author} •{" "}
                        {new Date(item.createdAt).toLocaleString("en-US")}
                      </p>
                      <p className="mt-2">{item.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No notes yet. Add the first one.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outbound comms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Template
                </label>
                <select
                  className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                  value={outboundTemplate}
                  onChange={(event) => {
                    const selected = outboundTemplates.find(
                      (template) => template.name === event.target.value,
                    );
                    setOutboundTemplate(event.target.value);
                    if (selected) {
                      setOutboundSubject(selected.subject);
                      setOutboundBody(selected.body);
                    }
                  }}
                >
                  <option value="">Custom</option>
                  {outboundTemplates.map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Email subject"
                value={outboundSubject}
                onChange={(event) => setOutboundSubject(event.target.value)}
              />
              <textarea
                className="min-h-[140px] w-full rounded-md border border-input bg-white/80 p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Email body"
                value={outboundBody}
                onChange={(event) => setOutboundBody(event.target.value)}
              />
              <Input
                type="date"
                value={outboundSentAt}
                onChange={(event) => setOutboundSentAt(event.target.value)}
              />
              <Button onClick={handleOutboundLog} disabled={outboundSaving}>
                {outboundSaving ? "Logging..." : "Log email"}
              </Button>
              {outboundStatus ? (
                <p className="text-sm text-muted-foreground">
                  {outboundStatus}
                </p>
              ) : null}
              <Separator />
              <div className="space-y-3 text-sm">
                {outboundLog.length ? (
                  outboundLog.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {item.subject ?? "Email"}{" "}
                        {item.author ? `• ${item.author}` : ""} •{" "}
                        {new Date(item.sentAt).toLocaleString("en-US")}
                      </p>
                      {item.body ? <p className="mt-2">{item.body}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No outbound emails logged yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Campaign notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="min-h-[140px] w-full rounded-md border border-input bg-white/80 p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="High-level campaign notes, positioning, goals..."
                value={campaignNotes}
                onChange={(event) => setCampaignNotes(event.target.value)}
              />
              <Button onClick={handleCrmUpdate}>Save campaign notes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Primary contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Contact name"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
              />
              <Input
                placeholder="Role (manager, label, publicist)"
                value={contactRole}
                onChange={(event) => setContactRole(event.target.value)}
              />
              <Input
                placeholder="Emails (comma separated)"
                value={contactEmails}
                onChange={(event) => setContactEmails(event.target.value)}
              />
              <Input
                placeholder="Instagram link"
                value={contactInstagram}
                onChange={(event) => setContactInstagram(event.target.value)}
              />
              <Input
                placeholder="Website link"
                value={contactWebsite}
                onChange={(event) => setContactWebsite(event.target.value)}
              />
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-white/80 p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Contact notes"
                value={contactNotes}
                onChange={(event) => setContactNotes(event.target.value)}
              />
              <Button onClick={handleContactUpdate}>Save contact</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Comma-separated tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
              />
              <Button onClick={handleTagsUpdate}>Save tags</Button>
              {tagItems.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {tagItems.map((tagItem) => (
                    <span
                      key={tagItem.id}
                      className="rounded-full border border-white/70 bg-white/80 px-2 py-1"
                    >
                      {tagItem.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No tags yet.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Assigned to
              </label>
              <select
                className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                disabled={!isAdmin}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email ?? user.id}
                  </option>
                ))}
              </select>
              {isAdmin ? (
                <Button onClick={handleAssign}>Update owner</Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Admin access required to assign.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CRM stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Stage
              </label>
              <select
                className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={!isAdmin}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {status === "WON" || status === "LOST" ? (
                <Input
                  placeholder={
                    status === "WON"
                      ? "Why did we win?"
                      : "Why did we lose?"
                  }
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  disabled={!isAdmin}
                />
              ) : null}
              {isAdmin ? (
                <Button onClick={handleStatus}>Update stage</Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Admin access required to update stage.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next step & reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Next step date
              </label>
              <Input
                type="date"
                value={nextStepAt}
                onChange={(event) => setNextStepAt(event.target.value)}
              />
              <Input
                placeholder="Next step note"
                value={nextStepNote}
                onChange={(event) => setNextStepNote(event.target.value)}
              />
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Reminder date
              </label>
              <Input
                type="date"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
              />
              <Button onClick={handleCrmUpdate}>Save CRM fields</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {stageHistory.length ? (
                stageHistory.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {item.fromStatus} → {item.toStatus}
                      {item.author ? ` • ${item.author}` : ""} •{" "}
                      {new Date(item.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No stage changes yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Add activity
              </label>
              <select
                className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                value={activityType}
                onChange={(event) => setActivityType(event.target.value)}
              >
                {activityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Details (optional)"
                value={activityDetail}
                onChange={(event) => setActivityDetail(event.target.value)}
              />
              <Button onClick={handleAddActivity}>Log activity</Button>
              <Separator />
              <div className="space-y-3 text-sm">
                {activities.length ? (
                  activities.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {item.type}
                        {item.author ? ` • ${item.author}` : ""} •{" "}
                        {new Date(item.createdAt).toLocaleString("en-US")}
                      </p>
                      {item.detail ? <p className="mt-2">{item.detail}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No activity logged yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
