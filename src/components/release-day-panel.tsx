"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ReleaseDayPanelEntry = {
  id: string;
  artistId: string;
  artistName: string;
  releaseName: string | null;
  releaseType: string | null;
  releaseDate: string;
  releaseUrl: string | null;
  spotifyUrl: string | null;
  spotifyImage: string | null;
  monthlyListeners: number | null;
  spotifyFollowers: number | null;
  spotifyPopularity: number | null;
  spotifyGenres: string[];
  status: string;
  ownerName: string | null;
  nextStepAt: string | null;
  nextStepNote: string | null;
};

type ReleaseDayPanelProps = {
  entries: ReleaseDayPanelEntry[];
  selectedDayLabel: string | null;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const statusOptions = ["LEAD", "CONTACTED", "NEGOTIATING", "WON", "LOST"];

function parseDay(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

export function ReleaseDayPanel({
  entries,
  selectedDayLabel,
}: ReleaseDayPanelProps) {
  const [activeEntry, setActiveEntry] = useState<ReleaseDayPanelEntry | null>(
    null,
  );
  const [noteBody, setNoteBody] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [nextStepAt, setNextStepAt] = useState("");
  const [nextStepNote, setNextStepNote] = useState("");
  const [saving, setSaving] = useState(false);

  const openEntry = (entry: ReleaseDayPanelEntry) => {
    setActiveEntry(entry);
    setStatusValue(entry.status);
    setNextStepAt(entry.nextStepAt ?? "");
    setNextStepNote(entry.nextStepNote ?? "");
    setNoteBody("");
  };

  const handleStatusUpdate = async () => {
    if (!activeEntry) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `/api/artists/${activeEntry.artistId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusValue }),
        },
      );
      if (!response.ok) {
        throw new Error("Status update failed.");
      }
      setActiveEntry({ ...activeEntry, status: statusValue });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleNextStepUpdate = async () => {
    if (!activeEntry) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/artists/${activeEntry.artistId}/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStepNote: nextStepNote.trim() || null,
          nextStepAt: nextStepAt ? `${nextStepAt}T00:00:00.000Z` : null,
        }),
      });
      if (!response.ok) {
        throw new Error("Next step update failed.");
      }
      setActiveEntry({
        ...activeEntry,
        nextStepAt: nextStepAt || null,
        nextStepNote: nextStepNote || null,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!activeEntry || !noteBody.trim()) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `/api/artists/${activeEntry.artistId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: noteBody.trim() }),
        },
      );
      if (!response.ok) {
        throw new Error("Note failed.");
      }
      setNoteBody("");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      {selectedDayLabel ? (
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          {selectedDayLabel}
        </p>
      ) : null}
      {entries.length === 0 ? (
        <p className="text-muted-foreground">
          {selectedDayLabel
            ? "No releases on this day."
            : "No releases on the calendar yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openEntry(entry)}
              className="w-full rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] transition hover:bg-white"
            >
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                {dateFormatter.format(parseDay(entry.releaseDate))}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {entry.artistName}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.releaseName ?? "Release"}
              </p>
            </button>
          ))}
        </div>
      )}
      {activeEntry ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setActiveEntry(null)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            aria-label="Close"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/60 bg-white/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  {dateFormatter.format(parseDay(activeEntry.releaseDate))}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  {activeEntry.releaseName ?? "Release"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeEntry.artistName}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveEntry(null)}
              >
                Close
              </Button>
            </div>

            {activeEntry.spotifyImage ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/70 bg-white/80">
                <img
                  src={activeEntry.spotifyImage}
                  alt={activeEntry.artistName}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{activeEntry.status}</Badge>
              {activeEntry.releaseType ? (
                <Badge variant="outline">{activeEntry.releaseType}</Badge>
              ) : null}
              {activeEntry.ownerName ? (
                <Badge variant="outline">{activeEntry.ownerName}</Badge>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {activeEntry.monthlyListeners !== null ? (
                <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1">
                  {numberFormatter.format(activeEntry.monthlyListeners)} listeners
                </span>
              ) : null}
              {activeEntry.spotifyFollowers !== null ? (
                <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1">
                  {numberFormatter.format(activeEntry.spotifyFollowers)} followers
                </span>
              ) : null}
              {activeEntry.spotifyPopularity !== null ? (
                <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1">
                  Popularity {activeEntry.spotifyPopularity}
                </span>
              ) : null}
            </div>

            {activeEntry.spotifyGenres.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {activeEntry.spotifyGenres.slice(0, 6).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/70 bg-white/80 px-2 py-1"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 space-y-4 rounded-2xl border border-white/70 bg-white/80 p-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  Status
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                    value={statusValue}
                    onChange={(event) => setStatusValue(event.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleStatusUpdate}
                    disabled={saving}
                  >
                    Update
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  Next step
                </p>
                <div className="mt-2 space-y-2">
                  <input
                    type="date"
                    className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                    value={nextStepAt}
                    onChange={(event) => setNextStepAt(event.target.value)}
                  />
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                    value={nextStepNote}
                    onChange={(event) => setNextStepNote(event.target.value)}
                    placeholder="Add the next step note..."
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleNextStepUpdate}
                    disabled={saving}
                  >
                    Save next step
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  Add note
                </p>
                <div className="mt-2 space-y-2">
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-input bg-white/80 p-2 text-sm"
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    placeholder="Quick note for the artist..."
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddNote}
                    disabled={saving || !noteBody.trim()}
                  >
                    Add note
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/artists/${activeEntry.artistId}`}>
                  View artist
                </Link>
              </Button>
              {activeEntry.releaseUrl ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={activeEntry.releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open release
                  </Link>
                </Button>
              ) : null}
              {activeEntry.spotifyUrl ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={activeEntry.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Spotify
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
