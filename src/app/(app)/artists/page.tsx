import { getServerSession } from "next-auth";

import { ArtistsPanel } from "@/components/artists-panel";
import { type ArtistRow } from "@/components/artist-table";
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
  const contact = parseString(resolvedSearchParams.contact, "all");
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

  let contactFilter: ArtistWhere | null = null;
  if (contact === "email") {
    contactFilter = { email: { not: null } };
  } else if (contact === "instagram") {
    contactFilter = { instagram: { not: null } };
  } else if (contact === "links") {
    contactFilter = {
      OR: [
        { website: { not: null } },
        { facebook: { not: null } },
        { x: { not: null } },
        { twitter: { not: null } },
        { tiktok: { not: null } },
        { youtube: { not: null } },
        { soundcloud: { not: null } },
      ],
    };
  } else if (contact === "any") {
    contactFilter = {
      OR: [
        { email: { not: null } },
        { instagram: { not: null } },
        { website: { not: null } },
        { facebook: { not: null } },
        { x: { not: null } },
        { twitter: { not: null } },
        { tiktok: { not: null } },
        { youtube: { not: null } },
        { soundcloud: { not: null } },
      ],
    };
  }

  if (contactFilter) {
    if (where.OR) {
      where.AND = [{ OR: where.OR }, contactFilter];
      delete where.OR;
    } else {
      Object.assign(where, contactFilter);
    }
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

  const sessionPromise = getServerSession(authOptions);
  const artists = await prisma.artist.findMany({
    where,
    orderBy: orderByMap[sort] ?? orderByMap["created-desc"],
    include: {
      owner: true,
      tags: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const filteredCount = await prisma.artist.count({ where });
  const statusGroups = await prisma.artist.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const needsSyncCount = await prisma.artist.count({
    where: { needsSync: true },
  });
  const totalCount = await prisma.artist.count();
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const upcomingNextSteps = await prisma.artist.count({
    where: {
      nextStepAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    },
  });
  const upcomingReminders = await prisma.artist.count({
    where: {
      reminderAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    },
  });
  const session = await sessionPromise;

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
      <ArtistsPanel
        artists={rows}
        totalCount={filteredCount}
        page={page}
        pageSize={pageSize}
        query={query}
        status={status}
        contact={contact}
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
    </div>
  );
}
