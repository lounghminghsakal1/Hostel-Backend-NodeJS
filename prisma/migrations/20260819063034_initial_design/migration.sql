-- CreateEnum
CREATE TYPE "RoleNameEnum" AS ENUM ('STUDENT', 'HOSTEL_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "roleName" "RoleNameEnum" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" SERIAL NOT NULL,
    "collegeName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" SERIAL NOT NULL,
    "hostelName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "collegeId" INTEGER NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,
    "hodName" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "collegeId" INTEGER NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "hostelId" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" SERIAL NOT NULL,
    "studentName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "parentMobileNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "roomId" INTEGER,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAdminProfile" (
    "id" SERIAL NOT NULL,
    "hostelAdminName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "hostelId" INTEGER NOT NULL,

    CONSTRAINT "HostelAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "College_collegeName_key" ON "College"("collegeName");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_collegeId_hostelName_key" ON "Hostel"("collegeId", "hostelName");

-- CreateIndex
CREATE UNIQUE INDEX "Department_collegeId_departmentName_key" ON "Department"("collegeId", "departmentName");

-- CreateIndex
CREATE UNIQUE INDEX "Room_hostelId_roomNumber_key" ON "Room"("hostelId", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_contactNumber_key" ON "StudentProfile"("contactNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAdminProfile_contactNumber_key" ON "HostelAdminProfile"("contactNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAdminProfile_userId_key" ON "HostelAdminProfile"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAdminProfile" ADD CONSTRAINT "HostelAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAdminProfile" ADD CONSTRAINT "HostelAdminProfile_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
