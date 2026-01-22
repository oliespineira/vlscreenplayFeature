-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "coverImageLink" TEXT;

-- CreateTable
CREATE TABLE "VisualElement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisualElement_projectId_idx" ON "VisualElement"("projectId");

-- CreateIndex
CREATE INDEX "VisualElement_sceneId_idx" ON "VisualElement"("sceneId");

-- AddForeignKey
ALTER TABLE "VisualElement" ADD CONSTRAINT "VisualElement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
