"use client";

import { useEffect, useMemo, useState } from "react";

import { ReleaseCalendar, type ReleaseEntry } from "@/components/release-calendar";
import {
  ReleaseDayPanel,
  type ReleaseDayPanelEntry,
} from "@/components/release-day-panel";
import { ReleaseCalendarFilters } from "@/components/release-calendar-filters";
import { SavedViews } from "@/components/saved-views";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OwnerOption = {
  id: string;
  label: string;
};

type ReleaseCalendarViewProps = {
  monthParam: string;
  prevMonth: string;
  nextMonth: string;
  entries: ReleaseDayPanelEntry[];
  statusFilter: string;
  ownerFilter: string;
  genreFilter: string;
  owners: OwnerOption[];
  genres: string[];
  initialSelectedDay: string | null;
};

function parseMonthParam(monthParam: string) {
  const [yearValue, monthValue] = monthParam.split("-").map(Number);
  if (
    Number.isNaN(yearValue) ||
    Number.isNaN(monthValue) ||
    monthValue < 1 ||
    monthValue > 12
  ) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(yearValue, monthValue - 1, 1));
}

function parseDayParam(dayParam: string) {
  const [year, month, day] = dayParam.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function ReleaseCalendarView({
  monthParam,
  prevMonth,
  nextMonth,
  entries,
  statusFilter,
  ownerFilter,
  genreFilter,
  owners,
  genres,
  initialSelectedDay,
}: ReleaseCalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(
    initialSelectedDay,
  );

  useEffect(() => {
    setSelectedDay(initialSelectedDay);
  }, [initialSelectedDay]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("month", monthParam);
    if (selectedDay) {
      params.set("day", selectedDay);
    } else {
      params.delete("day");
    }
    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [monthParam, selectedDay]);

  const monthDate = useMemo(
    () => parseMonthParam(monthParam),
    [monthParam],
  );

  const calendarEntries = useMemo<ReleaseEntry[]>(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        artistId: entry.artistId,
        artistName: entry.artistName,
        releaseName: entry.releaseName,
        releaseType: entry.releaseType,
        releaseDate: entry.releaseDate,
        releaseUrl: entry.releaseUrl,
      })),
    [entries],
  );

  const filteredEntries = selectedDay
    ? entries.filter((entry) => entry.releaseDate === selectedDay)
    : entries;

  const selectedDayLabel = selectedDay
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(parseDayParam(selectedDay))
    : null;

  const uniqueArtists = new Set(entries.map((entry) => entry.artistId)).size;

  const handleSelectDay = (day: string) => {
    setSelectedDay((current) => (current === day ? null : day));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ReleaseCalendar
        monthDate={monthDate}
        releases={calendarEntries}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ReleaseCalendarFilters
              monthParam={monthParam}
              status={statusFilter}
              owner={ownerFilter}
              genre={genreFilter}
              owners={owners}
              genres={genres}
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
              {entries.length} release{entries.length === 1 ? "" : "s"} scheduled.
            </p>
            <p>
              {uniqueArtists} artist{uniqueArtists === 1 ? "" : "s"} represented.
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
              entries={filteredEntries}
              selectedDayLabel={selectedDayLabel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
