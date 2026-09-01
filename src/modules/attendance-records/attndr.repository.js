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

const AttendanceRecordRepository = {
  findHostelById,
  markAttendance
};

export default AttendanceRecordRepository;