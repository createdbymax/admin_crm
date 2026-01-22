import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuditTracker } from "@/components/audit-tracker";
import { GlobalSearch } from "@/components/global-search";
import { UserMenu } from "@/components/user-menu";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email?.endsWith("@losthills.io")) {
    redirect("/login");
  }

  const isAdmin = session.user.isAdmin ?? false;

  return (
    <div className="min-h-screen">
      <AuditTracker />
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Lost Hills
              </p>
              <h1 className="text-xl font-semibold">Artist CRM</h1>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/artists"
                className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
              >
                Artists
              </Link>
              <Link
                href="/calendar"
                className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
              >
                Release calendar
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin/audit"
                  className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
                >
                  Audit log
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  href="/reports"
                  className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
                >
                  Reports
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GlobalSearch />
            <UserMenu email={session.user.email ?? ""} />
          </div>
        </div>
      </header>
      <Separator />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
