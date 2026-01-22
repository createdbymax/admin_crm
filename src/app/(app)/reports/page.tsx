import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StatusGroup = { status: string; _count: { status: number } };
type TransitionRow = { fromStatus: string; toStatus: string; _count: { _all: number } };
type ReasonGroup = { wonReason?: string | null; lostReason?: string | null; _count: { _all: number } };
type OwnerRow = { id: string; name: string | null; email: string | null };
type OwnerStatRow = { ownerId: string | null; status: string; _count: { _all: number } };

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/artists");
  }

  const [statusGroups, transitions, wonReasons, lostReasons, owners, ownerStats] =
    await Promise.all([
      prisma.artist.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.artistStageHistory.groupBy({
        by: ["fromStatus", "toStatus"],
        _count: { _all: true },
      }),
      prisma.artist.groupBy({
        by: ["wonReason"],
        where: { status: "WON", wonReason: { not: null } },
        _count: { _all: true },
      }),
      prisma.artist.groupBy({
        by: ["lostReason"],
        where: { status: "LOST", lostReason: { not: null } },
        _count: { _all: true },
      }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
      prisma.artist.groupBy({
        by: ["ownerId", "status"],
        _count: { _all: true },
      }),
    ]);

  const sortedWonReasons = [...(wonReasons as ReasonGroup[])].sort(
    (a, b) => b._count._all - a._count._all,
  );
  const sortedLostReasons = [...(lostReasons as ReasonGroup[])].sort(
    (a, b) => b._count._all - a._count._all,
  );

  const statusCounts = (statusGroups as StatusGroup[]).reduce<Record<string, number>>(
    (acc, group) => {
      acc[group.status] = group._count.status;
      return acc;
    },
    {},
  );

  const ownerMap = new Map(
    (owners as OwnerRow[]).map((owner) => [
      owner.id,
      owner.name ?? owner.email ?? "Unknown",
    ]),
  );

  const ownerSummary = new Map<
    string,
    { name: string; total: number; won: number; lost: number }
  >();

  (ownerStats as OwnerStatRow[]).forEach((row) => {
    const ownerId = row.ownerId ?? "unassigned";
    const name = row.ownerId
      ? ownerMap.get(row.ownerId) ?? "Unknown"
      : "Unassigned";
    const current = ownerSummary.get(ownerId) ?? {
      name,
      total: 0,
      won: 0,
      lost: 0,
    };
    current.total += row._count._all;
    if (row.status === "WON") {
      current.won += row._count._all;
    }
    if (row.status === "LOST") {
      current.lost += row._count._all;
    }
    ownerSummary.set(ownerId, current);
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Reports
        </p>
        <h2 className="text-3xl font-semibold">Pipeline insights</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Snapshot of pipeline health, stage movement, and outreach outcomes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total artists</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Won</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {statusCounts.WON ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lost</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {statusCounts.LOST ?? 0}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage totals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(statusCounts).map(([status, count]) => (
                <TableRow key={status}>
                  <TableCell>{status}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stage transitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transitions as TransitionRow[]).map((row) => (
                <TableRow
                  key={`${row.fromStatus}-${row.toStatus}`}
                >
                  <TableCell>{row.fromStatus}</TableCell>
                  <TableCell>{row.toStatus}</TableCell>
                  <TableCell className="text-right">
                    {row._count._all}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Win reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWonReasons.length ? (
                  sortedWonReasons.map((row) => (
                    <TableRow key={row.wonReason ?? "unknown"}>
                      <TableCell>{row.wonReason}</TableCell>
                      <TableCell className="text-right">
                        {row._count._all}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No win reasons logged yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loss reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLostReasons.length ? (
                  sortedLostReasons.map((row) => (
                    <TableRow key={row.lostReason ?? "unknown"}>
                      <TableCell>{row.lostReason}</TableCell>
                      <TableCell className="text-right">
                        {row._count._all}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No loss reasons logged yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(ownerSummary.values()).map((summary) => (
                <TableRow key={summary.name}>
                  <TableCell>{summary.name}</TableCell>
                  <TableCell className="text-right">{summary.total}</TableCell>
                  <TableCell className="text-right">{summary.won}</TableCell>
                  <TableCell className="text-right">{summary.lost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
