"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ArtistRow = {
  id: string;
  name: string;
  status: string;
  ownerName: string | null;
  ownerId: string | null;
  spotifyUrl: string | null;
  spotifyId: string | null;
  instagram: string | null;
  monthlyListeners: number | null;
  email: string | null;
  website: string | null;
  spotifyFollowers: number | null;
  spotifyPopularity: number | null;
  spotifyGenres: string[];
  tags: Array<{ id: string; name: string }>;
  spotifyImage: string | null;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: string | null;
  spotifyLatestReleaseUrl: string | null;
  spotifyLatestReleaseType: string | null;
  spotifyLastSyncedAt: string | null;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const statusOptions = ["LEAD", "CONTACTED", "NEGOTIATING", "WON", "LOST"];

type OwnerOption = { id: string; label: string };

type ArtistTableProps = {
  artists: ArtistRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
  status: string;
  ownerId: string;
  sort: string;
  tag: string;
  ownerOptions: OwnerOption[];
  tagOptions: OwnerOption[];
  isAdmin: boolean;
};

export function ArtistTable({
  artists,
  totalCount,
  page,
  pageSize,
  query,
  status,
  ownerId,
  sort,
  tag,
  ownerOptions,
  tagOptions,
  isAdmin,
}: ArtistTableProps) {
  const router = useRouter();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOwnerId, setBulkOwnerId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("LEAD");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const displayCount = useMemo(() => artists.length, [artists.length]);
  const selectedCount = selectedIds.size;
  const allSelected =
    artists.length > 0 && artists.every((artist) => selectedIds.has(artist.id));

  useEffect(() => {
    setSelectedIds(new Set());
  }, [artists]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        artists.forEach((artist) => next.delete(artist.id));
      } else {
        artists.forEach((artist) => next.add(artist.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (artistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) {
        next.delete(artistId);
      } else {
        next.add(artistId);
      }
      return next;
    });
  };

  const runBulkAction = async (
    action: "assign" | "status" | "sync",
    payload: Record<string, unknown>,
  ) => {
    if (!selectedIds.size) {
      return;
    }
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const response = await fetch("/api/artists/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          artistIds: Array.from(selectedIds),
          ...payload,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Bulk action failed.");
      }
      setBulkMessage(data.message ?? "Bulk update complete.");
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bulk action failed.";
      setBulkMessage(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRefresh = async (artistId: string) => {
    setRefreshingId(artistId);
    try {
      const response = await fetch("/api/spotify/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artistId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Refresh failed.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/70 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)]">
      <div className="sticky top-4 z-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/60 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Search
            </p>
            <Input
              placeholder="Artist, email, Instagram..."
              value={query}
              onChange={(event) =>
                updateParams({ q: event.target.value.trim() })
              }
              className="w-56"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Status
            </p>
            <select
              className="w-40 rounded-md border border-input bg-white/80 p-2 text-sm"
              value={status}
              onChange={(event) => updateParams({ status: event.target.value })}
            >
              <option value="all">All</option>
              <option value="LEAD">Lead</option>
              <option value="CONTACTED">Contacted</option>
              <option value="NEGOTIATING">Negotiating</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Owner
            </p>
            <select
              className="w-40 rounded-md border border-input bg-white/80 p-2 text-sm"
              value={ownerId}
              onChange={(event) => updateParams({ owner: event.target.value })}
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Tag
            </p>
            <select
              className="w-40 rounded-md border border-input bg-white/80 p-2 text-sm"
              value={tag}
              onChange={(event) => updateParams({ tag: event.target.value })}
            >
              <option value="all">All</option>
              {tagOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Sort
            </p>
            <select
              className="w-44 rounded-md border border-input bg-white/80 p-2 text-sm"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
            >
              <option value="created-desc">Newest</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="listeners-desc">Monthly listeners</option>
              <option value="followers-desc">Spotify followers</option>
              <option value="popularity-desc">Popularity</option>
              <option value="release-desc">Latest release date</option>
              <option value="synced-desc">Last synced</option>
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              router.push(pathname);
            }}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {selectedCount ? (
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs text-muted-foreground">
              <span>{selectedCount} selected</span>
              {isAdmin ? (
                <>
                  <select
                    className="rounded-md border border-input bg-white/80 p-1 text-xs"
                    value={bulkOwnerId}
                    onChange={(event) => setBulkOwnerId(event.target.value)}
                  >
                    <option value="" disabled>
                      Assign owner
                    </option>
                    <option value="__unassigned__">Unassigned</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runBulkAction("assign", {
                        ownerId:
                          bulkOwnerId === "__unassigned__"
                            ? null
                            : bulkOwnerId,
                      })
                    }
                    disabled={bulkLoading || !bulkOwnerId}
                  >
                    Apply owner
                  </Button>
                  <select
                    className="rounded-md border border-input bg-white/80 p-1 text-xs"
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runBulkAction("status", { status: bulkStatus })
                    }
                    disabled={bulkLoading}
                  >
                    Apply status
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBulkAction("sync", {})}
                disabled={bulkLoading}
              >
                Sync Spotify
              </Button>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Showing {displayCount} of {totalCount}
          </p>
        </div>
      </div>
      {bulkMessage ? (
        <div className="border-b border-white/60 px-6 py-2 text-xs text-muted-foreground">
          {bulkMessage}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/60 px-6 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="rounded-md border border-input bg-white/80 p-1 text-xs"
            value={pageSize}
            onChange={(event) => {
              updateParams({ pageSize: event.target.value });
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              goToPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Select all artists on this page"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Spotify</TableHead>
            <TableHead>Latest release</TableHead>
            <TableHead className="text-right">Sync</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.map((artist) => (
            <TableRow key={artist.id}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${artist.name}`}
                  checked={selectedIds.has(artist.id)}
                  onChange={() => toggleSelectOne(artist.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Link
                    className="text-sm font-semibold hover:underline"
                    href={`/artists/${artist.id}`}
                  >
                    {artist.name}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">
                    {artist.spotifyGenres.length
                      ? artist.spotifyGenres.slice(0, 3).join(", ")
                      : "Genres pending"}
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="secondary">{artist.status}</Badge>
                    <span>{artist.ownerName ?? "Unassigned"}</span>
                  </div>
                  {artist.tags.length ? (
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {artist.tags.map((tagItem) => (
                        <span
                          key={tagItem.id}
                          className="rounded-full border border-white/70 bg-white/80 px-2 py-0.5"
                        >
                          {tagItem.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  {artist.email ? <span>{artist.email}</span> : null}
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
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2 text-[11px]">
                  <div className="flex flex-wrap gap-2">
                    {artist.monthlyListeners !== null ? (
                      <Badge variant="secondary">
                        {numberFormatter.format(artist.monthlyListeners)}{" "}
                        listeners
                      </Badge>
                    ) : null}
                    {artist.spotifyFollowers !== null ? (
                      <Badge variant="outline">
                        {numberFormatter.format(artist.spotifyFollowers)}{" "}
                        followers
                      </Badge>
                    ) : null}
                    {artist.spotifyPopularity !== null ? (
                      <Badge variant="outline">
                        Popularity {artist.spotifyPopularity}
                      </Badge>
                    ) : null}
                  </div>
                  {artist.spotifyUrl ? (
                    <a
                      className="text-primary hover:underline"
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Spotify
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No Spotify link</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-[11px]">
                  {artist.spotifyLatestReleaseName ? (
                    <>
                      <span className="font-semibold">
                        {artist.spotifyLatestReleaseName}
                      </span>
                      <span className="text-muted-foreground">
                        {artist.spotifyLatestReleaseType ?? "Release"} •{" "}
                        {artist.spotifyLatestReleaseDate
                          ? new Date(
                              artist.spotifyLatestReleaseDate,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Date pending"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Sync to fetch latest release
                    </span>
                  )}
                  {artist.spotifyLatestReleaseUrl ? (
                    <a
                      className="text-primary hover:underline"
                      href={artist.spotifyLatestReleaseUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View release
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/artists/${artist.id}`}>View</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefresh(artist.id)}
                    disabled={refreshingId === artist.id}
                  >
                    {refreshingId === artist.id ? "Syncing..." : "Sync"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
