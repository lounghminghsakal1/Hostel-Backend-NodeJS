/*
  Warnings:

  - Added the required column `updatedAt` to the `UpcomingEvent` table without a default value. This is not possible if the table is not empty.
  - Made the column `eventDescription` on table `UpcomingEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AccountSetupToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "AttendanceRecord" ALTER COLUMN "reportedTime" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Hostel" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "HostelAdminProfile" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "LeaveApplication" ALTER COLUMN "fromDate" SET DATA TYPE DATE,
ALTER COLUMN "toDate" SET DATA TYPE DATE,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "MessFeePayment" ALTER COLUMN "paidAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "MonthlyMessBill" ALTER COLUMN "lastDate" SET DATA TYPE DATE,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "StudentProfile" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "UpcomingEvent" ADD COLUMN     "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(3) NOT NULL,
ALTER COLUMN "eventDescription" SET NOT NULL,
ALTER COLUMN "startingAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "endingAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);
