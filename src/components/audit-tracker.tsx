"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AuditTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!pathname) {
      return;
    }
    const fullPath = search ? `${pathname}?${search}` : pathname;
    if (lastPath.current === fullPath) {
      return;
    }
    lastPath.current = fullPath;

    void fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "page.view",
        path: fullPath,
      }),
    });
  }, [pathname, search]);

  return null;
}
