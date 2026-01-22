-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "creative" TEXT,
ADD COLUMN     "headerImageUrl" TEXT;

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "sequenceIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneImage" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'upload',
    "attribution" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceneImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_projectId_idx" ON "Scene"("projectId");

-- CreateIndex
CREATE INDEX "Scene_projectId_sequenceIndex_idx" ON "Scene"("projectId", "sequenceIndex");

-- CreateIndex
CREATE INDEX "SceneImage_sceneId_idx" ON "SceneImage"("sceneId");

-- CreateIndex
CREATE INDEX "SceneImage_sceneId_position_idx" ON "SceneImage"("sceneId", "position");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneImage" ADD CONSTRAINT "SceneImage_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
