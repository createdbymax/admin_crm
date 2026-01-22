import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [row] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;

  return NextResponse.json({
    now: row?.now?.toISOString() ?? null,
  });
}
