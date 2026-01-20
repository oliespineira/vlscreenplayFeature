-- CreateTable
CREATE TABLE "LookbookDraft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scriptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logline" TEXT,
    "genreTags" TEXT[],
    "timePeriod" TEXT,
    "toneKeywords" TEXT[],
    "lensLanguage" TEXT NOT NULL,
    "lightingMotifs" TEXT[],
    "palette" JSONB NOT NULL,
    "compositionRules" TEXT[],
    "cameraMovementRules" TEXT[],
    "referencesSeed" JSONB NOT NULL,
    "knobs" JSONB,
    "source" JSONB,

    CONSTRAINT "LookbookDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationBoard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB NOT NULL,

    CONSTRAINT "InspirationBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualBible" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "inspirationBoardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "onePageSummary" TEXT NOT NULL,
    "doList" TEXT[],
    "dontList" TEXT[],
    "styleRules" JSONB NOT NULL,
    "shotDesignPrinciples" TEXT[],
    "sceneOverrides" JSONB NOT NULL,
    "ruleSources" JSONB,

    CONSTRAINT "VisualBible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryboardPromptSet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "visualBibleId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "continuityHeader" TEXT NOT NULL,
    "beats" JSONB NOT NULL,
    "cohesionWarnings" TEXT[],
    "imageResultIds" TEXT[],

    CONSTRAINT "StoryboardPromptSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LookbookDraft_projectId_idx" ON "LookbookDraft"("projectId");

-- CreateIndex
CREATE INDEX "InspirationBoard_projectId_idx" ON "InspirationBoard"("projectId");

-- CreateIndex
CREATE INDEX "InspirationBoard_lookbookId_idx" ON "InspirationBoard"("lookbookId");

-- CreateIndex
CREATE INDEX "VisualBible_projectId_idx" ON "VisualBible"("projectId");

-- CreateIndex
CREATE INDEX "StoryboardPromptSet_projectId_idx" ON "StoryboardPromptSet"("projectId");

-- CreateIndex
CREATE INDEX "StoryboardPromptSet_sceneId_idx" ON "StoryboardPromptSet"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryboardPromptSet_visualBibleId_sceneId_key" ON "StoryboardPromptSet"("visualBibleId", "sceneId");

-- AddForeignKey
ALTER TABLE "LookbookDraft" ADD CONSTRAINT "LookbookDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationBoard" ADD CONSTRAINT "InspirationBoard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationBoard" ADD CONSTRAINT "InspirationBoard_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "LookbookDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualBible" ADD CONSTRAINT "VisualBible_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualBible" ADD CONSTRAINT "VisualBible_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "LookbookDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualBible" ADD CONSTRAINT "VisualBible_inspirationBoardId_fkey" FOREIGN KEY ("inspirationBoardId") REFERENCES "InspirationBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryboardPromptSet" ADD CONSTRAINT "StoryboardPromptSet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryboardPromptSet" ADD CONSTRAINT "StoryboardPromptSet_visualBibleId_fkey" FOREIGN KEY ("visualBibleId") REFERENCES "VisualBible"("id") ON DELETE CASCADE ON UPDATE CASCADE;
