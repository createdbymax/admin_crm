import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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

type AuditLogWithUser = Awaited<
  ReturnType<typeof prisma.auditLog.findMany>
>[number];

function formatActor(name?: string | null, email?: string | null) {
  if (name && email) {
    return `${name} (${email})`;
  }
  return name ?? email ?? "Unknown";
}

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/artists");
  }

  const logs: AuditLogWithUser[] = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Admin
        </p>
        <h2 className="text-3xl font-semibold">Audit log</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Most recent activity across the CRM. Showing the last 200 events.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: AuditLogWithUser) => {
                const actor = formatActor(log.user?.name, log.userEmail);
                const metadata = log.metadata
                  ? JSON.stringify(log.metadata)
                  : "";
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell>{actor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entityType && log.entityId
                        ? `${log.entityType}:${log.entityId}`
                        : log.entityType ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.path ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-[320px] whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {metadata || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No audit activity yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
