"use client";

import { SessionProvider } from "next-auth/react";

type SessionProviderProps = {
  children: React.ReactNode;
};

export function SessionProviderWrapper({ children }: SessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
