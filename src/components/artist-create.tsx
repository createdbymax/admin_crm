"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type SelectedArtist = {
  id: string;
  name: string;
  email: string | null;
  instagram: string | null;
  website: string | null;
};

type ArtistCreateProps = {
  selectedArtist: SelectedArtist | null;
  onClearSelection?: () => void;
};

export function ArtistCreate({
  selectedArtist,
  onClearSelection,
}: ArtistCreateProps) {
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
  const isEditing = Boolean(selectedArtist);

  const reset = () => {
    setName("");
    setSpotifyUrl("");
    setEmail("");
    setInstagram("");
    setWebsite("");
    setMonthlyListeners("");
    setSyncNow(true);
  };

  useEffect(() => {
    if (selectedArtist) {
      setEmail(selectedArtist.email ?? "");
      setInstagram(selectedArtist.instagram ?? "");
      setWebsite(selectedArtist.website ?? "");
      setStatus(null);
      return;
    }
    reset();
    setStatus(null);
  }, [selectedArtist]);

  const clearSelection = () => {
    onClearSelection?.();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditing && !name.trim()) {
      setStatus("Name is required.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const fallbackError = isEditing
      ? "Failed to update contact."
      : "Failed to create artist.";
    try {
      const normalizeField = (value: string) => {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
      };
      const endpoint = isEditing
        ? `/api/artists/${selectedArtist?.id}/contact`
        : "/api/artists";
      const payload = isEditing
        ? {
            email: normalizeField(email),
            instagram: normalizeField(instagram),
            website: normalizeField(website),
          }
        : {
            name,
            spotifyUrl,
            email,
            instagram,
            website,
            monthlyListeners,
            syncNow,
          };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? fallbackError);
      }

      setStatus(isEditing ? "Contact updated." : "Artist added.");
      if (isEditing) {
        clearSelection();
      } else {
        reset();
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : fallbackError;
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Update contact" : "Add artist"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Updating contact details for{" "}
              <span className="font-semibold text-foreground">
                {selectedArtist?.name ?? "Selected artist"}
              </span>
              .
            </p>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear selection
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Manually add an artist and optionally sync Spotify now.
          </p>
        )}
        <Separator />
        <form className="space-y-3" onSubmit={handleSubmit}>
          {isEditing ? null : (
            <>
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
            </>
          )}
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
          {isEditing ? null : (
            <>
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
            </>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
                ? "Update contact"
                : "Add artist"}
          </Button>
        </form>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
