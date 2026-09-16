/*
  Warnings:

  - You are about to drop the column `locationDeviationFromhostel` on the `AttendanceRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "locationDeviationFromhostel",
ADD COLUMN     "locationDeviationFromHostel" DOUBLE PRECISION;
