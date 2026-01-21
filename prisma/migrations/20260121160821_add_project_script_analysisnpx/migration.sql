-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scriptAnalysis" JSONB,
ADD COLUMN     "scriptText" TEXT NOT NULL DEFAULT '';
