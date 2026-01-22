import { ReleaseCalendarView } from "@/components/release-calendar-view";
import type { ReleaseDayPanelEntry } from "@/components/release-day-panel";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/cache";

type ArtistWhere = Record<string, unknown>;
type ReleaseWhere = Record<string, unknown>;
type UserListItem = { id: string; name: string | null; email: string | null };
type GenreRow = { spotifyGenres: string[] | null };
type ReleaseItem = {
  id: string;
  name: string | null;
  releaseType: string | null;
  releaseDate: Date;
  releaseUrl: string | null;
  artist: {
    id: string;
    name: string;
    spotifyUrl: string | null;
    spotifyImage: string | null;
    monthlyListeners: number | null;
    spotifyFollowers: number | null;
    spotifyPopularity: number | null;
    spotifyGenres: string[] | null;
    nextStepAt: Date | null;
    nextStepNote: string | null;
    status: string;
    owner: { name: string | null; email: string | null } | null;
  };
};
type ArtistFallbackItem = {
  id: string;
  name: string;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: Date | null;
  spotifyLatestReleaseUrl: string | null;
  spotifyLatestReleaseType: string | null;
  spotifyUrl: string | null;
  spotifyImage: string | null;
  monthlyListeners: number | null;
  spotifyFollowers: number | null;
  spotifyPopularity: number | null;
  spotifyGenres: string[] | null;
  nextStepAt: Date | null;
  nextStepNote: string | null;
  status: string;
  owner: { name: string | null; email: string | null } | null;
};

type PageProps = {
  searchParams?: {
    month?: string;
    day?: string;
    status?: string;
    owner?: string;
    genre?: string;
  };
};

const monthParamPattern = /^\d{4}-\d{2}$/;

function getMonthDate(monthParam?: string) {
  const now = new Date();
  if (!monthParam || !monthParamPattern.test(monthParam)) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const [yearValue, monthValue] = monthParam.split("-").map(Number);
  if (
    Number.isNaN(yearValue) ||
    Number.isNaN(monthValue) ||
    monthValue < 1 ||
    monthValue > 12
  ) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  return new Date(Date.UTC(yearValue, monthValue - 1, 1));
}

function formatMonthParam(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateParam(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDayParam(dayParam: string) {
  const [year, month, day] = dayParam.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const monthDate = getMonthDate(resolvedSearchParams?.month);
  const rawSelectedDay =
    resolvedSearchParams?.day &&
    /^\d{4}-\d{2}-\d{2}$/.test(resolvedSearchParams.day)
      ? resolvedSearchParams.day
      : null;
  const year = monthDate.getUTCFullYear();
  const monthIndex = monthDate.getUTCMonth();
  const selectedDayDate = rawSelectedDay ? parseDayParam(rawSelectedDay) : null;
  const selectedDay =
    selectedDayDate &&
    selectedDayDate.getUTCFullYear() === year &&
    selectedDayDate.getUTCMonth() === monthIndex
      ? rawSelectedDay
      : null;
  const statusFilter = resolvedSearchParams?.status ?? "all";
  const ownerFilter = resolvedSearchParams?.owner ?? "all";
  const genreFilter = resolvedSearchParams?.genre ?? "all";
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const prevMonth = formatMonthParam(new Date(Date.UTC(year, monthIndex - 1, 1)));
  const nextMonth = formatMonthParam(new Date(Date.UTC(year, monthIndex + 1, 1)));

  const releaseArtistWhere: ArtistWhere = {};
  const releaseWhere: ReleaseWhere = {
    releaseDate: {
      gte: start,
      lt: end,
    },
  };

  const artistWhere: ArtistWhere = {
    spotifyLatestReleaseDate: {
      gte: start,
      lt: end,
    },
  };

  if (statusFilter !== "all") {
    releaseArtistWhere.status = statusFilter as never;
    artistWhere.status = statusFilter as never;
  }

  if (ownerFilter === "unassigned") {
    releaseArtistWhere.ownerId = null;
    artistWhere.ownerId = null;
  } else if (ownerFilter !== "all") {
    releaseArtistWhere.ownerId = ownerFilter;
    artistWhere.ownerId = ownerFilter;
  }

  if (genreFilter !== "all") {
    releaseArtistWhere.spotifyGenres = { has: genreFilter };
    artistWhere.spotifyGenres = { has: genreFilter };
  }

  if (Object.keys(releaseArtistWhere).length > 0) {
    releaseWhere.artist = releaseArtistWhere;
  }

  const [releases, artistsFallback, owners, genreOptions] = await Promise.all([
    prisma.artistRelease.findMany({
      where: releaseWhere,
      orderBy: { releaseDate: "asc" },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            spotifyUrl: true,
            spotifyImage: true,
            monthlyListeners: true,
            spotifyFollowers: true,
            spotifyPopularity: true,
            spotifyGenres: true,
            nextStepAt: true,
            nextStepNote: true,
            status: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.artist.findMany({
      where: artistWhere,
      orderBy: { spotifyLatestReleaseDate: "asc" },
      select: {
        id: true,
        name: true,
        spotifyLatestReleaseName: true,
        spotifyLatestReleaseDate: true,
        spotifyLatestReleaseUrl: true,
        spotifyLatestReleaseType: true,
        spotifyUrl: true,
        spotifyImage: true,
        monthlyListeners: true,
        spotifyFollowers: true,
        spotifyPopularity: true,
        spotifyGenres: true,
        nextStepAt: true,
        nextStepNote: true,
        status: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    // Cache genre list for 5 minutes since it changes infrequently
    getCached('all-genres', 300000, async () => {
      const rows = await prisma.artist.findMany({ 
        select: { spotifyGenres: true },
        where: { spotifyGenres: { isEmpty: false } }
      });
      return Array.from(
        new Set(rows.flatMap((row: GenreRow) => row.spotifyGenres ?? []))
      ).sort();
    }),
  ]);

  const releaseEntries = (releases as ReleaseItem[]).map((release) => ({
      id: release.id,
      artistId: release.artist.id,
      artistName: release.artist.name,
      releaseName: release.name,
      releaseType: release.releaseType,
      releaseDate: release.releaseDate,
      releaseUrl: release.releaseUrl,
      spotifyUrl: release.artist.spotifyUrl,
      spotifyImage: release.artist.spotifyImage,
      monthlyListeners: release.artist.monthlyListeners,
      spotifyFollowers: release.artist.spotifyFollowers,
      spotifyPopularity: release.artist.spotifyPopularity,
      spotifyGenres: release.artist.spotifyGenres ?? [],
      nextStepAt: release.artist.nextStepAt
        ? formatDateParam(release.artist.nextStepAt)
        : null,
      nextStepNote: release.artist.nextStepNote ?? null,
      status: release.artist.status,
      ownerName: release.artist.owner?.name ?? release.artist.owner?.email ?? null,
    }));

  const artistsWithHistory = new Set(releaseEntries.map((entry) => entry.artistId));
  const fallbackEntries = (artistsFallback as ArtistFallbackItem[])
    .filter((artist) => artist.spotifyLatestReleaseDate)
    .filter((artist) => !artistsWithHistory.has(artist.id))
    .map((artist) => ({
      id: `latest-${artist.id}`,
      artistId: artist.id,
      artistName: artist.name,
      releaseName: artist.spotifyLatestReleaseName,
      releaseType: artist.spotifyLatestReleaseType,
      releaseDate: artist.spotifyLatestReleaseDate as Date,
      releaseUrl: artist.spotifyLatestReleaseUrl,
      spotifyUrl: artist.spotifyUrl,
      spotifyImage: artist.spotifyImage,
      monthlyListeners: artist.monthlyListeners,
      spotifyFollowers: artist.spotifyFollowers,
      spotifyPopularity: artist.spotifyPopularity,
      spotifyGenres: artist.spotifyGenres ?? [],
      nextStepAt: artist.nextStepAt
        ? formatDateParam(artist.nextStepAt)
        : null,
      nextStepNote: artist.nextStepNote ?? null,
      status: artist.status,
      ownerName: artist.owner?.name ?? artist.owner?.email ?? null,
    }));

  const allEntries = [...releaseEntries, ...fallbackEntries];

  const allEntriesSerialized: ReleaseDayPanelEntry[] = allEntries.map(
    (entry) => ({
      id: entry.id,
      artistId: entry.artistId,
      artistName: entry.artistName,
      releaseName: entry.releaseName,
      releaseType: entry.releaseType,
      releaseDate: formatDateParam(entry.releaseDate),
      releaseUrl: entry.releaseUrl,
      spotifyUrl: entry.spotifyUrl,
      spotifyImage: entry.spotifyImage,
      monthlyListeners: entry.monthlyListeners,
      spotifyFollowers: entry.spotifyFollowers,
      spotifyPopularity: entry.spotifyPopularity,
      spotifyGenres: entry.spotifyGenres,
      status: entry.status,
      ownerName: entry.ownerName,
      nextStepAt: entry.nextStepAt,
      nextStepNote: entry.nextStepNote,
    }),
  );

  return (
    <ReleaseCalendarView
      monthParam={formatMonthParam(monthDate)}
      prevMonth={prevMonth}
      nextMonth={nextMonth}
      entries={allEntriesSerialized}
      statusFilter={statusFilter}
      ownerFilter={ownerFilter}
      genreFilter={genreFilter}
      owners={(owners as UserListItem[]).map((owner) => ({
        id: owner.id,
        label: owner.name ?? owner.email ?? owner.id,
      }))}
      genres={genreOptions}
      initialSelectedDay={selectedDay}
    />
  );
}
