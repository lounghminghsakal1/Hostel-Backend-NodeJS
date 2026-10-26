/*
  Warnings:

  - You are about to drop the column `personalDivision` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Announcement` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostelId` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Made the column `eventDescription` on table `UpcomingEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AnnouncementStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AnnouncementTypeEnum" AS ENUM ('COLLEGE_ANNOUNCEMENT', 'HOSTEL_ANNOUNCEMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "personalDivision",
DROP COLUMN "priority",
DROP COLUMN "url",
ADD COLUMN     "announcementType" "AnnouncementTypeEnum" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "hostelId" INTEGER NOT NULL,
ADD COLUMN     "isImportant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "AnnouncementStatusEnum" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "UpcomingEvent" ALTER COLUMN "eventDescription" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
