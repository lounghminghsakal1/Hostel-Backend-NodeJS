-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "attendanceMarkingEndTime" TEXT DEFAULT '22:00',
ADD COLUMN     "attendanceMarkingStartTime" TEXT DEFAULT '20:30',
ADD COLUMN     "attendanceRadius" DOUBLE PRECISION NOT NULL DEFAULT 800;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "studentImageUrl" TEXT;

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" SERIAL NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "reportedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedImageUrl" TEXT NOT NULL,
    "faceMatchingPercentage" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isLocatedWithinHostelRadius" BOOLEAN NOT NULL DEFAULT false,
    "locationDeviationFromhostel" DOUBLE PRECISION,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_attendanceDate_key" ON "AttendanceRecord"("studentId", "attendanceDate");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
