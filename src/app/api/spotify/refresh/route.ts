import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { syncArtistById } from "@/lib/spotify-sync";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { artistId?: string };
  if (!body.artistId) {
    return NextResponse.json({ error: "Missing artistId." }, { status: 400 });
  }

  try {
    const updated = await syncArtistById(body.artistId);
    await logAuditEvent({
      action: "spotify.refresh",
      userId: session?.user?.id ?? null,
      userEmail: email,
      entityType: "artist",
      entityId: body.artistId,
      request,
    });
    return NextResponse.json({ artist: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    await logAuditEvent({
      action: "spotify.refresh.failed",
      userId: session?.user?.id ?? null,
      userEmail: email,
      entityType: "artist",
      entityId: body.artistId,
      metadata: { error: message },
      request,
    });
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
