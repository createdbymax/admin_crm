"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SyncAllButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/spotify/sync-all", {
        method: "POST",
      });
      const data = (await response.json()) as {
        queued?: number;
        synced?: number;
        failed?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed.");
      }
      setStatus(
        `Synced ${data.synced ?? 0}/${data.queued ?? 0} artists${
          data.failed ? ` (${data.failed} failed)` : ""
        }.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleSync} disabled={isLoading}>
        {isLoading ? "Syncing..." : "Sync all Spotify"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
