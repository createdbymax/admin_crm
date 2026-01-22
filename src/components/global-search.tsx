"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  name: string;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: string | null;
  spotifyLatestReleaseType: string | null;
};

const RECENT_KEY = "crm.recentSearches";

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Date pending";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setRecent(parsed);
      }
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }, [recent]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(trimmed)}`,
        );
        if (!response.ok) {
          throw new Error("Search failed.");
        }
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [value]);

  const commitRecent = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)];
      return next.slice(0, 6);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      router.push("/artists");
      return;
    }
    commitRecent(trimmed);
    router.push(`/artists?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  const handleSelectArtist = (artistId: string) => {
    router.push(`/artists/${artistId}`);
    setOpen(false);
  };

  const recentItems = useMemo(
    () => recent.filter((item) => item.toLowerCase().includes(value.toLowerCase())),
    [recent, value],
  );

  return (
    <div className="relative" ref={containerRef}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Search artists, releases, notes..."
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-9 w-60"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.35)]">
          {value.trim() ? (
            <>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Matches
              </p>
              <div className="mt-2 space-y-2">
                {loading ? (
                  <p className="text-xs text-muted-foreground">Searching...</p>
                ) : results.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No matching artists yet.
                  </p>
                ) : (
                  results.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectArtist(result.id)}
                      className="w-full rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left text-xs transition hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {result.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {result.spotifyLatestReleaseName ?? "Release"} •{" "}
                        {result.spotifyLatestReleaseType ?? "Type"} •{" "}
                        {formatDateLabel(result.spotifyLatestReleaseDate)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Recent searches
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nothing yet.
                  </p>
                ) : (
                  recentItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        commitRecent(item);
                        router.push(`/artists?q=${encodeURIComponent(item)}`);
                        setOpen(false);
                      }}
                      className="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
