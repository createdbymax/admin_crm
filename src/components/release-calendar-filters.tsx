"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OwnerOption = {
  id: string;
  label: string;
};

type ReleaseCalendarFiltersProps = {
  monthParam: string;
  status: string;
  owner: string;
  genre: string;
  owners: OwnerOption[];
  genres: string[];
  selectedDay: string | null;
  className?: string;
};

export function ReleaseCalendarFilters({
  monthParam,
  status,
  owner,
  genre,
  owners,
  genres,
  selectedDay,
  className,
}: ReleaseCalendarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthParam);
    if (selectedDay) {
      params.set("day", selectedDay);
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/calendar?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    params.set("month", monthParam);
    if (selectedDay) {
      params.set("day", selectedDay);
    }
    router.push(`/calendar?${params.toString()}`);
  };

  const exportParams = new URLSearchParams();
  exportParams.set("month", monthParam);
  if (status !== "all") {
    exportParams.set("status", status);
  }
  if (owner !== "all") {
    exportParams.set("owner", owner);
  }
  if (genre !== "all") {
    exportParams.set("genre", genre);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Status
        </label>
        <select
          className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
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
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Owner
        </label>
        <select
          className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
          value={owner}
          onChange={(event) => updateParams({ owner: event.target.value })}
        >
          <option value="all">All</option>
          <option value="unassigned">Unassigned</option>
          {owners.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Genre
        </label>
        <select
          className="w-full rounded-md border border-input bg-white/80 p-2 text-sm"
          value={genre}
          onChange={(event) => updateParams({ genre: event.target.value })}
        >
          <option value="all">All</option>
          {genres.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={resetFilters}>
          Clear filters
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`/api/calendar/releases.ics?${exportParams.toString()}`}>
            Export ICS
          </a>
        </Button>
      </div>
    </div>
  );
}
