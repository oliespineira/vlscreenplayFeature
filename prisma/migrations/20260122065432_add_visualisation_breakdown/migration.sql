-- CreateTable
CREATE TABLE "VisualisationRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualisationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneBreakdown" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "sceneIndex" INTEGER NOT NULL,
    "slugline" TEXT NOT NULL,
    "sceneText" TEXT,
    "logline" TEXT,
    "props" JSONB,
    "characters" JSONB,
    "locations" JSONB,
    "wardrobe" JSONB,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisualisationRun_projectId_idx" ON "VisualisationRun"("projectId");

-- CreateIndex
CREATE INDEX "VisualisationRun_scriptId_idx" ON "VisualisationRun"("scriptId");

-- CreateIndex
CREATE UNIQUE INDEX "VisualisationRun_projectId_scriptId_key" ON "VisualisationRun"("projectId", "scriptId");

-- CreateIndex
CREATE INDEX "SceneBreakdown_projectId_idx" ON "SceneBreakdown"("projectId");

-- CreateIndex
CREATE INDEX "SceneBreakdown_scriptId_idx" ON "SceneBreakdown"("scriptId");

-- CreateIndex
CREATE INDEX "SceneBreakdown_projectId_scriptId_idx" ON "SceneBreakdown"("projectId", "scriptId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneBreakdown_projectId_scriptId_sceneIndex_key" ON "SceneBreakdown"("projectId", "scriptId", "sceneIndex");

-- AddForeignKey
ALTER TABLE "VisualisationRun" ADD CONSTRAINT "VisualisationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneBreakdown" ADD CONSTRAINT "SceneBreakdown_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
