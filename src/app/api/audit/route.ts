import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
    path?: string | null;
  };

  if (!body.action?.trim()) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  await logAuditEvent({
    action: body.action.trim(),
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: body.entityType ?? null,
    entityId: body.entityId ?? null,
    metadata: body.metadata ?? null,
    path: body.path ?? null,
    request,
  });

  return NextResponse.json({ ok: true });
}
