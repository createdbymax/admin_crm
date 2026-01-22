import { getServerSession } from "next-auth";
import Image from "next/image";
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
    <div className="min-h-screen overflow-x-hidden">
      <AuditTracker />
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
            <Link href="/artists" className="flex items-center gap-3">
              <Image
                src="/losthillsdark.svg"
                alt="Lost Hills"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
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
                Calendar
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin/audit"
                  className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
                >
                  Audit
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
              <Link
                href="/help"
                className="rounded-full border border-transparent px-3 py-1 text-muted-foreground transition hover:border-white/70 hover:bg-white/70 hover:text-foreground"
              >
                Help
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <GlobalSearch />
            <UserMenu email={session.user.email ?? ""} />
          </div>
        </div>
      </header>
      <Separator />
      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
