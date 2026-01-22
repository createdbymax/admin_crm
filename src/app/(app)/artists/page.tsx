import { getServerSession } from "next-auth";

import { ArtistCreate } from "@/components/artist-create";
import { ArtistImport } from "@/components/artist-import";
import { ArtistTable, type ArtistRow } from "@/components/artist-table";
import { SavedViews } from "@/components/saved-views";
import { SyncAllButton } from "@/components/sync-all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ArtistWhere = Record<string, unknown>;
type ArtistOrderBy = Array<Record<string, "asc" | "desc">>;

type ArtistsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

type ArtistListItem = {
  id: string;
  name: string;
  status: string;
  ownerId: string | null;
  owner: { name: string | null; email: string | null } | null;
  spotifyUrl: string | null;
  spotifyId: string | null;
  instagram: string | null;
  monthlyListeners: number | null;
  email: string | null;
  website: string | null;
  spotifyFollowers: number | null;
  spotifyPopularity: number | null;
  spotifyGenres: string[] | null;
  tags: Array<{ id: string; name: string }>;
  spotifyImage: string | null;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: Date | null;
  spotifyLatestReleaseUrl: string | null;
  spotifyLatestReleaseType: string | null;
  spotifyLastSyncedAt: Date | null;
};

type UserListItem = { id: string; name: string | null; email: string | null };
type TagListItem = { id: string; name: string };

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseString(value: string | string[] | undefined, fallback: string) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? fallback;
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const page = parseNumber(resolvedSearchParams.page, 1);
  const pageSize = [10, 25, 50].includes(
    parseNumber(resolvedSearchParams.pageSize, 25),
  )
    ? parseNumber(resolvedSearchParams.pageSize, 25)
    : 25;
  const query = parseString(resolvedSearchParams.q, "");
  const status = parseString(resolvedSearchParams.status, "all");
  const owner = parseString(resolvedSearchParams.owner, "all");
  const sort = parseString(resolvedSearchParams.sort, "created-desc");
  const tag = parseString(resolvedSearchParams.tag, "all");

  const where: ArtistWhere = {};

  if (query.trim()) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { instagram: { contains: query, mode: "insensitive" } },
      { website: { contains: query, mode: "insensitive" } },
      { spotifyLatestReleaseName: { contains: query, mode: "insensitive" } },
      { notes: { some: { body: { contains: query, mode: "insensitive" } } } },
    ];
  }

  if (status !== "all") {
    where.status = status as never;
  }

  if (owner === "unassigned") {
    where.ownerId = null;
  } else if (owner !== "all") {
    where.ownerId = owner;
  }

  if (tag !== "all") {
    where.tags = { some: { id: tag } };
  }

  const orderByMap: Record<string, ArtistOrderBy> = {
    "created-desc": [{ createdAt: "desc" }],
    "name-asc": [{ name: "asc" }],
    "listeners-desc": [{ monthlyListeners: "desc" }, { createdAt: "desc" }],
    "followers-desc": [{ spotifyFollowers: "desc" }, { createdAt: "desc" }],
    "popularity-desc": [{ spotifyPopularity: "desc" }, { createdAt: "desc" }],
    "release-desc": [{ spotifyLatestReleaseDate: "desc" }, { createdAt: "desc" }],
    "synced-desc": [{ spotifyLastSyncedAt: "desc" }, { createdAt: "desc" }],
  };

  const [session, artists, filteredCount, statusGroups, needsSyncCount, totalCount, users, tags, upcomingNextSteps, upcomingReminders] =
    await Promise.all([
      getServerSession(authOptions),
      prisma.artist.findMany({
        where,
        orderBy: orderByMap[sort] ?? orderByMap["created-desc"],
        include: {
          owner: true,
          tags: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.artist.count({ where }),
      prisma.artist.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.artist.count({ where: { needsSync: true } }),
      prisma.artist.count(),
      prisma.user.findMany({ orderBy: { name: "asc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      prisma.artist.count({
        where: {
          nextStepAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          },
        },
      }),
      prisma.artist.count({
        where: {
          reminderAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          },
        },
      }),
    ]);

  const statusCounts = (statusGroups as Array<{
    status: string;
    _count: { status: number };
  }>).reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count.status;
      return acc;
    }, {});

  const rows: ArtistRow[] = (artists as ArtistListItem[]).map((artist) => ({
    id: artist.id,
    name: artist.name,
    status: artist.status,
    ownerName: artist.owner?.name ?? artist.owner?.email ?? null,
    ownerId: artist.ownerId ?? null,
    spotifyUrl: artist.spotifyUrl,
    spotifyId: artist.spotifyId,
    instagram: artist.instagram,
    monthlyListeners: artist.monthlyListeners,
    email: artist.email,
    website: artist.website,
    spotifyFollowers: artist.spotifyFollowers,
    spotifyPopularity: artist.spotifyPopularity,
    spotifyGenres: artist.spotifyGenres ?? [],
    tags: artist.tags.map((item) => ({ id: item.id, name: item.name })),
    spotifyImage: artist.spotifyImage,
    spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
    spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate
      ? artist.spotifyLatestReleaseDate.toISOString()
      : null,
    spotifyLatestReleaseUrl: artist.spotifyLatestReleaseUrl,
    spotifyLatestReleaseType: artist.spotifyLatestReleaseType,
    spotifyLastSyncedAt: artist.spotifyLastSyncedAt
      ? artist.spotifyLastSyncedAt.toISOString()
      : null,
  }));

  const isAdmin = session?.user?.isAdmin ?? false;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Artists
        </p>
        <h2 className="text-3xl font-semibold">Campaign targets</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Import your scraped CSV, enrich each artist with Spotify data, and
          keep outreach details in one place.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total artists</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {totalCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {statusCounts.LEAD ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacted</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {statusCounts.CONTACTED ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs Spotify sync</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {needsSyncCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next steps (7d)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {upcomingNextSteps}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reminders (7d)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {upcomingReminders}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ArtistTable
          artists={rows}
          totalCount={filteredCount}
          page={page}
          pageSize={pageSize}
          query={query}
          status={status}
          ownerId={owner}
          sort={sort}
          tag={tag}
          isAdmin={isAdmin}
          ownerOptions={(users as UserListItem[]).map((user) => ({
            id: user.id,
            label: user.name ?? user.email ?? user.id,
          }))}
          tagOptions={(tags as TagListItem[]).map((item) => ({
            id: item.id,
            label: item.name,
          }))}
        />
        <div className="space-y-6">
          <ArtistCreate />
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
            <p className="font-semibold text-foreground">
              Quick sync checklist
            </p>
            <ul className="mt-3 space-y-2">
              <li>Upload the latest scrape CSV.</li>
              <li>Sync Spotify to pull releases + stats.</li>
              <li>Start outreach with fresh context.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
