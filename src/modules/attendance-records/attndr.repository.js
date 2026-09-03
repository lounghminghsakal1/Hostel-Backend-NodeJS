import { prisma } from "../../configs/db.js";

const findHostelById = async (id) => {
  return prisma.hostel.findUnique({
    id: id
  });
};

const markAttendance = async (currentDate, capturedImageUrl, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, loggedInStudentProfileId) => {
  await prisma.attendanceRecord.create({
    data: {
      attendanceDate: currentDate,
      capturedImageUrl: capturedImageUrl,
      faceMatchingPercentage: faceMatchingPercentage,
      latitude: latitude,
      longitude: longitude,
      isLocatedWithinHostelRadius: isLocatedWithinHostelRadius,
      locationDeviationFromHostel: locationDeviationFromHostel,

      studentId: loggedInStudentProfileId
    }
  });
};

const getAllMarkedAttendanceRecords = async (where) => {
  return await prisma.attendanceRecord.findMany({
    where: where,
  });
};

const getTotalStudentsCount = async (hostelId) => {
  return await prisma.studentProfile.count({
    where: {
      hostelId: hostelId
    }
  });
};

const getAttendanceMarkedStudentsCount = async (where) => {
  return await prisma.attendanceRecord.count({
    where: where
  });
};

const AttendanceRecordRepository = {
  findHostelById,
  markAttendance,
  getAllMarkedAttendanceRecords,
  getTotalStudentsCount,
  getAttendanceMarkedStudentsCount,
};

export default AttendanceRecordRepository;