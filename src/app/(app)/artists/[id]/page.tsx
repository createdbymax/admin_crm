import { notFound } from "next/navigation";

import { ArtistDetail } from "@/components/artist-detail";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: { id: string };
};

export default async function ArtistDetailPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);
  const [artist, session] = await Promise.all([
    prisma.artist.findUnique({
      where: { id },
      include: {
        owner: true,
        tags: true,
        outboundMessages: {
          include: { user: true },
          orderBy: { sentAt: "desc" },
        },
        notes: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        stageHistory: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!artist) {
    notFound();
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const lastSynced = artist.spotifyLastSyncedAt?.getTime() ?? 0;
  const shouldAutoSync =
    (!artist.spotifyLastSyncedAt ||
      Date.now() - lastSynced > 1000 * 60 * 60 * 24 * 7) &&
    (artist.spotifyId || artist.spotifyUrl);

  return (
    <ArtistDetail
      artist={{
        id: artist.id,
        name: artist.name,
        status: artist.status,
        ownerId: artist.ownerId ?? null,
        spotifyUrl: artist.spotifyUrl,
        spotifyFollowers: artist.spotifyFollowers,
        spotifyPopularity: artist.spotifyPopularity,
        spotifyGenres: artist.spotifyGenres ?? [],
        spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
        spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate
          ? artist.spotifyLatestReleaseDate.toISOString()
          : null,
        spotifyLatestReleaseUrl: artist.spotifyLatestReleaseUrl,
        spotifyLastSyncedAt: artist.spotifyLastSyncedAt
          ? artist.spotifyLastSyncedAt.toISOString()
          : null,
        monthlyListeners: artist.monthlyListeners,
        email: artist.email,
        instagram: artist.instagram,
        website: artist.website,
        campaignNotes: artist.campaignNotes,
        nextStepAt: artist.nextStepAt ? artist.nextStepAt.toISOString() : null,
        nextStepNote: artist.nextStepNote,
        reminderAt: artist.reminderAt ? artist.reminderAt.toISOString() : null,
        lastContactedAt: artist.lastContactedAt
          ? artist.lastContactedAt.toISOString()
          : null,
        wonReason: artist.wonReason,
        lostReason: artist.lostReason,
        contactName: artist.contactName,
        contactRole: artist.contactRole,
        contactNotes: artist.contactNotes,
      }}
      tags={artist.tags.map((tag: { id: string; name: string }) => ({
        id: tag.id,
        name: tag.name,
      }))}
      users={users.map((user: { id: string; name: string | null; email: string | null }) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }))}
      notes={artist.notes.map((note: { id: string; body: string; createdAt: Date; user: { name: string | null; email: string | null } }) => ({
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        author: note.user.name ?? note.user.email ?? "Unknown",
      }))}
      activities={artist.activities.map((activity: { id: string; type: string; detail: string | null; createdAt: Date; user: { name: string | null; email: string | null } | null }) => ({
        id: activity.id,
        type: activity.type,
        detail: activity.detail,
        createdAt: activity.createdAt.toISOString(),
        author: activity.user?.name ?? activity.user?.email ?? null,
      }))}
      outboundMessages={artist.outboundMessages.map((message: { id: string; channel: string; subject: string | null; body: string | null; template: string | null; sentAt: Date; user: { name: string | null; email: string | null } | null }) => ({
        id: message.id,
        channel: message.channel,
        subject: message.subject,
        body: message.body,
        template: message.template,
        sentAt: message.sentAt.toISOString(),
        author: message.user?.name ?? message.user?.email ?? null,
      }))}
      stageHistory={artist.stageHistory.map((item: { id: string; fromStatus: string; toStatus: string; createdAt: Date; user: { name: string | null; email: string | null } | null }) => ({
        id: item.id,
        fromStatus: item.fromStatus,
        toStatus: item.toStatus,
        createdAt: item.createdAt.toISOString(),
        author: item.user?.name ?? item.user?.email ?? null,
      }))}
      shouldAutoSync={Boolean(shouldAutoSync)}
      isAdmin={session?.user?.isAdmin ?? false}
    />
  );
}
