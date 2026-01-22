import { ReleaseCalendar } from "@/components/release-calendar";
import {
  ReleaseDayPanel,
  type ReleaseDayPanelEntry,
} from "@/components/release-day-panel";
import { ReleaseCalendarFilters } from "@/components/release-calendar-filters";
import { SavedViews } from "@/components/saved-views";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

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

  const [releases, artistsFallback, owners, genreRows] = await Promise.all([
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
    prisma.artist.findMany({ select: { spotifyGenres: true } }),
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

  const dayEntries = selectedDay
    ? allEntries.filter(
        (entry) => formatDateParam(entry.releaseDate) === selectedDay,
      )
    : [];

  const panelEntries: ReleaseDayPanelEntry[] = (
    selectedDay ? dayEntries : allEntries
  ).map((entry) => ({
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
  }));

  const uniqueArtists = new Set(allEntries.map((entry) => entry.artistId))
    .size;
  const selectedDayLabel = selectedDay
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(parseDayParam(selectedDay))
    : null;
  const genreOptions = Array.from(
    new Set((genreRows as GenreRow[]).flatMap((row) => row.spotifyGenres ?? [])),
  ).sort();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ReleaseCalendar
        monthDate={monthDate}
        releases={allEntries}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        selectedDay={selectedDay}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ReleaseCalendarFilters
              monthParam={formatMonthParam(monthDate)}
              status={statusFilter}
              owner={ownerFilter}
              genre={genreFilter}
              owners={(owners as UserListItem[]).map((owner) => ({
                id: owner.id,
                label: owner.name ?? owner.email ?? owner.id,
              }))}
              genres={genreOptions}
              selectedDay={selectedDay}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved views</CardTitle>
          </CardHeader>
          <CardContent>
            <SavedViews storageKey="calendar" excludeKeys={["day"]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Month overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {allEntries.length} release
              {allEntries.length === 1 ? "" : "s"} scheduled.
            </p>
            <p>
              {uniqueArtists} artist
              {uniqueArtists === 1 ? "" : "s"} represented.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDay ? "Releases on this day" : "Releases this month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReleaseDayPanel
              entries={panelEntries}
              selectedDayLabel={selectedDayLabel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
