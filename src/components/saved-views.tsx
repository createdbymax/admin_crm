"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SavedView = {
  id: string;
  name: string;
  query: string;
};

type SavedViewsProps = {
  storageKey: string;
  label?: string;
  excludeKeys?: string[];
  className?: string;
};

export function SavedViews({
  storageKey,
  label = "Saved views",
  excludeKeys = [],
  className,
}: SavedViewsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");

  const resolvedKey = `crm.savedViews.${storageKey}`;

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    excludeKeys.forEach((key) => params.delete(key));
    return params.toString();
  }, [excludeKeys, searchParams]);

  useEffect(() => {
    const raw = localStorage.getItem(resolvedKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SavedView[];
      if (Array.isArray(parsed)) {
        setViews(parsed);
      }
    } catch {
      setViews([]);
    }
  }, [resolvedKey]);

  useEffect(() => {
    localStorage.setItem(resolvedKey, JSON.stringify(views));
  }, [resolvedKey, views]);

  const saveView = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const nextView: SavedView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      query: currentQuery,
    };
    setViews((prev) => [nextView, ...prev]);
    setName("");
  };

  const applyView = (view: SavedView) => {
    const url = view.query ? `${pathname}?${view.query}` : pathname;
    router.push(url);
  };

  const removeView = (id: string) => {
    setViews((prev) => prev.filter((view) => view.id !== id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Name this view"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-9 w-40"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={saveView}
          disabled={!name.trim()}
        >
          Save current
        </Button>
      </div>
      {views.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No saved views yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <div
              key={view.id}
              className="flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-2 py-1 text-xs text-muted-foreground"
            >
              <button
                type="button"
                onClick={() => applyView(view)}
                className="font-semibold text-foreground hover:underline"
              >
                {view.name}
              </button>
              <button
                type="button"
                onClick={() => removeView(view.id)}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label={`Remove ${view.name}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
