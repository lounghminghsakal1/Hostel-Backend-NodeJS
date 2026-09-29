/*
  Warnings:

  - Made the column `rollNumber` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ALTER COLUMN "rollNumber" SET NOT NULL;
