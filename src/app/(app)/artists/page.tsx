import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotionArtistsDatabase } from "@/components/notion-artists-database";

export default async function ArtistsPage() {
  const session = await getServerSession(authOptions);
  
  // Fetch all artists (we'll handle filtering client-side for now)
  const [artists, users, tags] = await Promise.all([
    prisma.artist.findMany({
      include: {
        owner: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
      // No limit - load all artists
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const isAdmin = session?.user?.isAdmin ?? false;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-10">
      <NotionArtistsDatabase
        artists={artists}
        users={users}
        tags={tags}
        isAdmin={isAdmin}
      />
    </div>
  );
}
