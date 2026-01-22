import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      isAdmin?: boolean;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
