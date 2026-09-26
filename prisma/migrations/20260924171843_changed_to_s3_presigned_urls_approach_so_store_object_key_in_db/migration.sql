/*
  Warnings:

  - You are about to drop the column `capturedImageUrl` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `studentImageUrl` on the `StudentProfile` table. All the data in the column will be lost.
  - Added the required column `capturedImageKey` to the `AttendanceRecord` table without a default value. This is not possible if the table is not empty.
  - Made the column `rollNumber` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "capturedImageUrl",
ADD COLUMN     "capturedImageKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "studentImageUrl",
ADD COLUMN     "studentImageKey" TEXT,
ALTER COLUMN "rollNumber" SET NOT NULL;
