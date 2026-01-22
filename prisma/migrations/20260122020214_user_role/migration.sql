-- CreateEnum
CREATE TYPE "OutboundChannel" AS ENUM ('EMAIL');

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "wonReason" TEXT;

-- CreateTable
CREATE TABLE "ArtistRelease" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "releaseUrl" TEXT,
    "releaseType" TEXT,
    "spotifyReleaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundMessage" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "OutboundChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "template" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistRelease_spotifyReleaseId_key" ON "ArtistRelease"("spotifyReleaseId");

-- CreateIndex
CREATE INDEX "ArtistRelease_artistId_idx" ON "ArtistRelease"("artistId");

-- CreateIndex
CREATE INDEX "ArtistRelease_releaseDate_idx" ON "ArtistRelease"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "OutboundMessage_artistId_idx" ON "OutboundMessage"("artistId");

-- CreateIndex
CREATE INDEX "OutboundMessage_sentAt_idx" ON "OutboundMessage"("sentAt");

-- CreateIndex
CREATE INDEX "_ArtistToTag_B_index" ON "_ArtistToTag"("B");

-- AddForeignKey
ALTER TABLE "ArtistRelease" ADD CONSTRAINT "ArtistRelease_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToTag" ADD CONSTRAINT "_ArtistToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToTag" ADD CONSTRAINT "_ArtistToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
