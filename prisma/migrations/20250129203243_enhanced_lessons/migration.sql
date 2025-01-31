/*
  Warnings:

  - You are about to drop the column `completedLessons` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "completedLessons";

-- CreateIndex
CREATE INDEX "Progress_completed_idx" ON "Progress"("completed");
