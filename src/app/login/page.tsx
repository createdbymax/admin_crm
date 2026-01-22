"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginClient() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const rawCallbackUrl = searchParams.get("callbackUrl");
    if (!rawCallbackUrl) {
      return "/artists";
    }
    return rawCallbackUrl.includes("/login") ? "/artists" : rawCallbackUrl;
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md border-white/70 bg-white/80 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Lost Hills</h1>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mt-1">
                Artist CRM
              </p>
            </div>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Artist outreach and management platform
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use your <span className="font-semibold">@losthills.io</span>{" "}
            Google account to continue.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6 text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
