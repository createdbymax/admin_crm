"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function ArtistImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Select a CSV file to import.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Import failed.");
      }

      const result = (await response.json()) as {
        imported: number;
        skippedDuplicates?: number;
        invalidRows?: number;
        autoSynced?: number;
      };
      const synced = result.autoSynced ?? 0;
      const duplicates = result.skippedDuplicates ?? 0;
      const invalidRows = result.invalidRows ?? 0;
      const parts = [
        `Imported ${result.imported} artist${result.imported === 1 ? "" : "s"}.`,
      ];
      if (synced) {
        parts.push(`Auto-synced ${synced}.`);
      }
      if (duplicates) {
        parts.push(`Skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.`);
      }
      if (invalidRows) {
        parts.push(`Skipped ${invalidRows} invalid row${invalidRows === 1 ? "" : "s"}.`);
      }
      setStatus(parts.join(" "));
      setFile(null);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import artists</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Drop a CSV from the Spotify scrape to seed new artist records.
        </p>
        <Separator />
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            type="file"
            accept=".csv"
            onChange={(event) =>
              setFile(event.target.files ? event.target.files[0] : null)
            }
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Importing..." : "Import CSV"}
          </Button>
        </form>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
