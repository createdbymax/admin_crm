-- CreateEnum
CREATE TYPE "SpotifySyncJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SpotifySyncJob" (
    "id" TEXT NOT NULL,
    "status" "SpotifySyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedById" TEXT,
    "cursor" TEXT,
    "total" INTEGER,
    "synced" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "batchSize" INTEGER NOT NULL DEFAULT 10,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifySyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpotifySyncJob_status_idx" ON "SpotifySyncJob"("status");

-- AddForeignKey
ALTER TABLE "SpotifySyncJob" ADD CONSTRAINT "SpotifySyncJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
