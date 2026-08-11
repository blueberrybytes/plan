-- CreateTable
CREATE TABLE "MeetingCrmNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalCompanyId" TEXT NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "url" TEXT,
    "canonicalTranscriptId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingCrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingCrmNote_workspaceId_startedAt_idx" ON "MeetingCrmNote"("workspaceId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingCrmNote_workspaceId_provider_externalCompanyId_dayBu_key" ON "MeetingCrmNote"("workspaceId", "provider", "externalCompanyId", "dayBucket");

-- CreateIndex
CREATE INDEX "Transcript_workspaceId_recordedAt_idx" ON "Transcript"("workspaceId", "recordedAt");

-- AddForeignKey
ALTER TABLE "MeetingCrmNote" ADD CONSTRAINT "MeetingCrmNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
