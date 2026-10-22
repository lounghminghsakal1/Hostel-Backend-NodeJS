-- CreateTable
CREATE TABLE "UpcomingEvent" (
    "id" SERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "startingAt" TIMESTAMP(3) NOT NULL,
    "endingAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventImageKey" TEXT,
    "eventLink" TEXT,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "hostelId" INTEGER NOT NULL,

    CONSTRAINT "UpcomingEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UpcomingEvent" ADD CONSTRAINT "UpcomingEvent_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
