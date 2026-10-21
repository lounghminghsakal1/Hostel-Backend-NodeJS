/*
  Warnings:

  - A unique constraint covering the columns `[hostelId,rollNumber]` on the table `StudentProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MonthEnum" AS ENUM ('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');

-- CreateEnum
CREATE TYPE "MonthlyMessBillStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED', 'EXPIRED');

-- CreateTable
CREATE TABLE "MonthlyMessBill" (
    "id" SERIAL NOT NULL,
    "month" "MonthEnum" NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "lastDate" TIMESTAMP(3) NOT NULL,
    "status" "MonthlyMessBillStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "hostelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyMessBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessFeePayment" (
    "id" SERIAL NOT NULL,
    "monthlyMessBillId" INTEGER NOT NULL,
    "studentProfileId" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyMessBill_month_year_hostelId_key" ON "MonthlyMessBill"("month", "year", "hostelId");

-- CreateIndex
CREATE UNIQUE INDEX "MessFeePayment_monthlyMessBillId_studentProfileId_key" ON "MessFeePayment"("monthlyMessBillId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_hostelId_rollNumber_key" ON "StudentProfile"("hostelId", "rollNumber");

-- AddForeignKey
ALTER TABLE "MonthlyMessBill" ADD CONSTRAINT "MonthlyMessBill_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessFeePayment" ADD CONSTRAINT "MessFeePayment_monthlyMessBillId_fkey" FOREIGN KEY ("monthlyMessBillId") REFERENCES "MonthlyMessBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessFeePayment" ADD CONSTRAINT "MessFeePayment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
