"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReleaseEntry = {
  id: string;
  artistId: string;
  artistName: string;
  releaseName: string | null;
  releaseType: string | null;
  releaseDate: string;
  releaseUrl: string | null;
};

type ReleaseCalendarProps = {
  monthDate: Date;
  releases: ReleaseEntry[];
  prevMonth: string;
  nextMonth: string;
  selectedDay?: string | null;
  onSelectDay?: (day: string) => void;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatISODateUTC(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthParam(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseDateParam(dayParam: string) {
  const [year, month, day] = dayParam.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function ReleaseCalendar({
  monthDate,
  releases,
  prevMonth,
  nextMonth,
  selectedDay,
  onSelectDay,
}: ReleaseCalendarProps) {
  const year = monthDate.getUTCFullYear();
  const monthIndex = monthDate.getUTCMonth();
  const startDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const todayKey = formatISODateUTC(new Date());
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate);

  const releasesByDay = releases.reduce<Record<string, ReleaseEntry[]>>(
    (acc, release) => {
      const key = formatISODateUTC(parseDateParam(release.releaseDate));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(release);
      return acc;
    },
    {},
  );

  const selectedDayKey =
    selectedDay && /^\d{4}-\d{2}-\d{2}$/.test(selectedDay) ? selectedDay : null;

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Release calendar
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl truncate">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/calendar?month=${prevMonth}`}>Prev</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/calendar?month=${nextMonth}`}>Next</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-3xl border border-white/70 bg-white/70 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.35)] overflow-hidden">
        {weekdays.map((label) => (
          <div
            key={label}
            className="bg-white/80 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:px-3 sm:py-3 sm:text-[11px]"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
        {Array.from({ length: totalCells }).map((_, index) => {
          const dayNumber = index - startDay + 1;
          const inMonth = dayNumber > 0 && dayNumber <= daysInMonth;
          const cellDate = inMonth
            ? new Date(Date.UTC(year, monthIndex, dayNumber))
            : null;
          const cellKey = cellDate ? formatISODateUTC(cellDate) : null;
          const dayReleases = cellKey ? releasesByDay[cellKey] ?? [] : [];
          const isToday = cellKey === todayKey;
          const isSelected = cellKey && cellKey === selectedDayKey;
          const visibleReleases = dayReleases.slice(0, 2);
          const hiddenCount =
            dayReleases.length > visibleReleases.length
              ? dayReleases.length - visibleReleases.length
              : 0;

          return (
            <div
              key={`day-${index}`}
              className={cn(
                "relative min-h-[80px] bg-white/85 p-1 transition-shadow sm:min-h-[120px] sm:p-2 md:p-3",
                !inMonth && "bg-white/40 text-muted-foreground",
                isToday && "ring-2 ring-primary/30 ring-inset",
                isSelected &&
                  "bg-white ring-2 ring-primary/60 ring-inset shadow-[0_15px_40px_-25px_rgba(15,23,42,0.45)]",
              )}
            >
              {inMonth && cellKey ? (
                onSelectDay ? (
                  <button
                    type="button"
                    onClick={() => onSelectDay(cellKey)}
                    aria-label={`View releases for ${cellKey}`}
                    className="absolute inset-0 z-0 cursor-pointer rounded-2xl bg-transparent"
                  />
                ) : (
                  <Link
                    href={`/calendar?month=${formatMonthParam(
                      monthDate,
                    )}&day=${cellKey}`}
                    aria-label={`View releases for ${cellKey}`}
                    className="absolute inset-0 z-0"
                  />
                )
              ) : null}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "text-xs font-semibold text-foreground",
                      !inMonth && "opacity-50",
                      inMonth && !dayReleases.length && "text-muted-foreground",
                    )}
                  >
                    {inMonth ? dayNumber : ""}
                  </span>
                  {inMonth && dayReleases.length > 0 ? (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {dayReleases.length}
                    </Badge>
                  ) : null}
                </div>
                {inMonth && dayReleases.length > 0 ? (
                  <div className="mt-1 space-y-1 sm:mt-3 sm:space-y-2">
                    {visibleReleases.map((release) => (
                      <Link
                        key={release.id}
                        href={`/artists/${release.artistId}`}
                        className="group block rounded-lg border border-white/70 bg-white/85 px-1 py-1 text-[9px] text-muted-foreground shadow-sm transition hover:border-white hover:bg-white hover:text-foreground sm:rounded-xl sm:px-2 sm:py-1.5 sm:text-[11px]"
                      >
                        <span className="block truncate font-semibold text-foreground">
                          {release.artistName}
                        </span>
                        <span className="hidden truncate sm:block">
                          {release.releaseName ?? "Release"}
                        </span>
                      </Link>
                    ))}
                    {hiddenCount > 0 && cellKey ? (
                      <span className="block rounded-lg border border-dashed border-white/70 bg-white/70 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:rounded-xl sm:px-2 sm:py-1 sm:text-[10px]">
                        +{hiddenCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
