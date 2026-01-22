import { getServerSession } from "next-auth";

import { ArtistsPanel } from "@/components/artists-panel";
import { type ArtistRow } from "@/components/artist-table";
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
    "created-asc": [{ createdAt: "asc" }],
    "name-asc": [{ name: "asc" }],
    "name-desc": [{ name: "desc" }],
    "listeners-desc": [{ monthlyListeners: "desc" }, { createdAt: "desc" }],
    "listeners-asc": [{ monthlyListeners: "asc" }, { createdAt: "desc" }],
    "followers-desc": [{ spotifyFollowers: "desc" }, { createdAt: "desc" }],
    "followers-asc": [{ spotifyFollowers: "asc" }, { createdAt: "desc" }],
    "popularity-desc": [{ spotifyPopularity: "desc" }, { createdAt: "desc" }],
    "popularity-asc": [{ spotifyPopularity: "asc" }, { createdAt: "desc" }],
  };

  const sessionPromise = getServerSession(authOptions);
  
  // Parallel queries for better performance
  const [artists, filteredCount, statusGroups, stats, users, tags, session] = await Promise.all([
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
    // Combined stats query using raw SQL for efficiency
    prisma.$queryRaw<Array<{
      total: bigint;
      needs_sync: bigint;
      upcoming_next_steps: bigint;
      upcoming_reminders: bigint;
    }>>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "needsSync" = true) as needs_sync,
        COUNT(*) FILTER (WHERE "nextStepAt" >= NOW() AND "nextStepAt" <= NOW() + INTERVAL '7 days') as upcoming_next_steps,
        COUNT(*) FILTER (WHERE "reminderAt" >= NOW() AND "reminderAt" <= NOW() + INTERVAL '7 days') as upcoming_reminders
      FROM "Artist"
    `,
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    sessionPromise,
  ]);

  const statsRow = stats[0];
  const totalCount = Number(statsRow?.total ?? 0);
  const needsSyncCount = Number(statsRow?.needs_sync ?? 0);
  const upcomingNextSteps = Number(statsRow?.upcoming_next_steps ?? 0);
  const upcomingReminders = Number(statsRow?.upcoming_reminders ?? 0);

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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Artists
        </p>
        <h2 className="text-2xl font-semibold sm:text-3xl">Campaign targets</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Import your scraped CSV, enrich each artist with Spotify data, and
          keep outreach details in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{totalCount}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Leads</p>
          <p className="text-lg font-semibold">{statusCounts.LEAD ?? 0}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Contacted</p>
          <p className="text-lg font-semibold">{statusCounts.CONTACTED ?? 0}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Needs sync</p>
          <p className="text-lg font-semibold">{needsSyncCount}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Next 7d</p>
          <p className="text-lg font-semibold">{upcomingNextSteps}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2">
          <p className="font-mono uppercase tracking-wider text-muted-foreground">Reminders</p>
          <p className="text-lg font-semibold">{upcomingReminders}</p>
        </div>
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
