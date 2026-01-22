"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function SyncAllButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  type SyncJob = {
    id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    total: number | null;
    synced: number;
    failed: number;
  };
  const [job, setJob] = useState<SyncJob | null>(null);

  useEffect(() => {
    let active = true;
    const loadActive = async () => {
      try {
        const response = await fetch("/api/spotify/sync-all?active=1");
        const data = (await response.json()) as { job?: SyncJob | null };
        if (!active) {
          return;
        }
        if (data.job && data.job.status !== "COMPLETED") {
          setJob(data.job);
          setStatus("Sync in progress...");
        }
      } catch {
        // Ignore startup polling errors.
      }
    };
    void loadActive();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!job || job.status === "COMPLETED" || job.status === "FAILED") {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/spotify/sync-all?jobId=${job.id}`,
        );
        const data = (await response.json()) as { job?: SyncJob | null };
        if (data.job) {
          setJob(data.job);
        }
      } catch {
        // Ignore polling errors.
      }
    }, 30000); // 30 seconds - Vercel-friendly polling
    return () => clearInterval(interval);
  }, [job?.id, job?.status]);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" ||
      !job ||
      (job.status !== "RUNNING" && job.status !== "QUEUED")
    ) {
      return;
    }
    const tick = async () => {
      try {
        await fetch("/api/spotify/sync-worker");
      } catch {
        // Ignore local worker errors.
      }
    };
    void tick();
    const interval = setInterval(tick, 30000); // 30 seconds - dev only
    return () => clearInterval(interval);
  }, [job?.status, job?.id]);

  useEffect(() => {
    if (!job) {
      return;
    }
    if (job.status === "COMPLETED") {
      setStatus(
        `Synced ${job.synced}/${job.total ?? job.synced} artists${
          job.failed ? ` (${job.failed} failed)` : ""
        }.`,
      );
    } else if (job.status === "FAILED") {
      setStatus("Sync failed.");
    } else {
      setStatus("Sync in progress...");
    }
  }, [job?.status, job?.synced, job?.total, job?.failed]);

  const handleSync = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/spotify/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      const data = (await response.json()) as {
        job?: SyncJob | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed.");
      }
      if (data.job) {
        setJob(data.job);
        setStatus("Sync queued...");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/spotify/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = (await response.json()) as {
        job?: SyncJob | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed.");
      }
      if (data.job) {
        setJob(data.job);
        setStatus("Sync queued...");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={handleSync}
        disabled={
          isLoading || job?.status === "RUNNING" || job?.status === "QUEUED"
        }
      >
        {isLoading || job?.status === "RUNNING" || job?.status === "QUEUED"
          ? "Syncing..."
          : "Sync all Spotify"}
      </Button>
      {job?.status === "RUNNING" || job?.status === "QUEUED" ? (
        <Button onClick={handleRestart} variant="outline" size="sm">
          Restart sync
        </Button>
      ) : null}
      {job && job.total ? (
        <div className="w-full max-w-xs">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-[width]"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((job.synced / job.total) * 100),
                )}%`,
              }}
            />
          </div>
        </div>
      ) : null}
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      {job ? (
        <p className="text-xs text-muted-foreground">
          {job.total
            ? `Status: ${job.status} — ${job.synced}/${job.total} synced${
                job.failed ? ` (${job.failed} failed)` : ""
              }`
            : `Status: ${job.status}`}
        </p>
      ) : null}
    </div>
  );
}
