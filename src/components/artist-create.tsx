"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function ArtistCreate() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [monthlyListeners, setMonthlyListeners] = useState("");
  const [syncNow, setSyncNow] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setName("");
    setSpotifyUrl("");
    setEmail("");
    setInstagram("");
    setWebsite("");
    setMonthlyListeners("");
    setSyncNow(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus("Name is required.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          spotifyUrl,
          email,
          instagram,
          website,
          monthlyListeners,
          syncNow,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create artist.");
      }

      setStatus("Artist added.");
      reset();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create artist.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add artist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manually add an artist and optionally sync Spotify now.
        </p>
        <Separator />
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            placeholder="Artist name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            placeholder="Spotify artist URL"
            value={spotifyUrl}
            onChange={(event) => setSpotifyUrl(event.target.value)}
          />
          <Input
            placeholder="Contact email(s) (comma separated)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            placeholder="Instagram link"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
          <Input
            placeholder="Website link"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
          <Input
            placeholder="Monthly listeners"
            value={monthlyListeners}
            onChange={(event) => setMonthlyListeners(event.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={syncNow}
              onChange={(event) => setSyncNow(event.target.checked)}
            />
            Sync Spotify after create
          </label>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add artist"}
          </Button>
        </form>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
