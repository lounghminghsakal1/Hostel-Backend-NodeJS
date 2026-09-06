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

const getAllMarkedAttendanceRecords = async (where, skip, take) => {
  return await prisma.attendanceRecord.findMany({
    where: where,
    skip,
    take
  });
};

const getTotalStudentsCount = async (hostelId) => {
  return await prisma.studentProfile.count({
    where: {
      hostelId: hostelId
    }
  });
};

const getDistinctAttendanceMarketStudentsCount = async (where) => {
  return await prisma.attendanceRecord.count({
    where: where
  });
};

const getStudentsWithAbsenses = async (hostelId, startDate, endDate, expectedDatesStrings, totalExpectedDays, skip, take) => {
  //get all students
  const students = await prisma.studentProfile.findMany({
    where: {
      hostelId
    },
    include: {
      attendanceRecords: {
        where: {
          attendanceDate: {
            gte: startDate,
            lt: endDate
          }
        },
        select: {
          attendanceDate: true
        }
      },
      department: {
        select: departmentName
      },
      room: {
        select: roomNumber
      }

    }
  });

  let absentStudents;
  for(const student of students) {
    const presentDates = new Set(student.attendanceRecords.map(r => r.attendanceDate.toISOString().split("T")[0]));
    const absentDates = expectedDatesStrings.filter(eD => !presentDates.has(eD));
    if(absentDates.length > 0) {
      absentStudents.push({
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        department: student.department.departmentName,
        roomNumber: student.room.roomNumber,
        absentDates
      });
    }
  }

  return {
    totalCount: absentStudents.length,
    records: absentStudents
  };
};

const AttendanceRecordRepository = {
  findHostelById,
  markAttendance,
  getAllMarkedAttendanceRecords,
  getTotalStudentsCount,
  getDistinctAttendanceMarketStudentsCount,
  getStudentsWithAbsenses
};

export default AttendanceRecordRepository;