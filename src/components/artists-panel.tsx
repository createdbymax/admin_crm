"use client";

import { useEffect, useMemo, useState } from "react";

import { ArtistCreate } from "@/components/artist-create";
import { ArtistImport } from "@/components/artist-import";
import { ArtistTable, type ArtistRow } from "@/components/artist-table";
import { SavedViews } from "@/components/saved-views";
import { SyncAllButton } from "@/components/sync-all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OwnerOption = { id: string; label: string };

type ArtistsPanelProps = {
  artists: ArtistRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
  status: string;
  contact: string;
  ownerId: string;
  sort: string;
  tag: string;
  ownerOptions: OwnerOption[];
  tagOptions: OwnerOption[];
  isAdmin: boolean;
};

export function ArtistsPanel({
  artists,
  totalCount,
  page,
  pageSize,
  query,
  status,
  contact,
  ownerId,
  sort,
  tag,
  ownerOptions,
  tagOptions,
  isAdmin,
}: ArtistsPanelProps) {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === selectedArtistId) ?? null,
    [artists, selectedArtistId],
  );

  useEffect(() => {
    if (selectedArtistId && !selectedArtist) {
      setSelectedArtistId(null);
    }
  }, [selectedArtist, selectedArtistId]);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px]">
      <ArtistTable
        artists={artists}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        query={query}
        status={status}
        contact={contact}
        ownerId={ownerId}
        sort={sort}
        tag={tag}
        isAdmin={isAdmin}
        ownerOptions={ownerOptions}
        tagOptions={tagOptions}
        selectedArtistId={selectedArtistId}
        onSelectArtist={(artist) => setSelectedArtistId(artist.id)}
      />
      <div className="space-y-6">
        <ArtistCreate
          selectedArtist={selectedArtist}
          onClearSelection={() => setSelectedArtistId(null)}
        />
        <Card>
          <CardHeader>
            <CardTitle>Saved views</CardTitle>
          </CardHeader>
          <CardContent>
            <SavedViews storageKey="artists" excludeKeys={["page"]} />
          </CardContent>
        </Card>
        <ArtistImport />
        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Sync Spotify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Synces up to 25 artists that are stale or missing data. Uses a
                conservative rate limit.
              </p>
              <SyncAllButton />
            </CardContent>
          </Card>
        ) : null}
        <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm text-muted-foreground shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] backdrop-blur">
          <p className="font-semibold text-foreground">Quick sync checklist</p>
          <ul className="mt-3 space-y-2">
            <li>Upload the latest scrape CSV.</li>
            <li>Sync Spotify to pull releases + stats.</li>
            <li>Start outreach with fresh context.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
