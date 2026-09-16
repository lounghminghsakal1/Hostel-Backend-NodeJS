import { prisma } from "../../configs/db.js";

const findHostelById = async (id) => {
  return await prisma.hostel.findUnique({
    where: {
      id: id
    }
  });
};

const markAttendance = async (currentDate, capturedImageUrl, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, loggedInStudentProfileId) => {
  return await prisma.attendanceRecord.create({
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

const getAttendanceRecordsPresent = async (attendanceWhere, skip, take) => {
  return await prisma.attendanceRecord.findMany({
    where: attendanceWhere,
    skip,
    take
  });
};

const getTotalCountOfAttendanceRecordPresent = async (attendanceWhere) => {
  return await prisma.attendanceRecord.count({
    where: attendanceWhere
  });
};

const getTotalOfStudentsOfHostel = async (hostelId) => {
  return await prisma.studentProfile.count({
    where: {
      hostelId: hostelId
    }
  });
};

const getTotalOfStudentsWithAtleastOnePresentDuringRange = async (attendanceWhere) => {
  return await prisma.attendanceRecord.count({
    where: attendanceWhere
  });
};

const getAbsentStudentsRecord = async (hostelId, expectedDates, skip, take) => {
  const students = await prisma.studentProfile.findMany({
    where: {
      hostelId
    },
    include: {
      attendanceRecords: {
        select: attendanceDate
      },
      department: {
        select: {
          departmentName: true
        }
      },
      room: {
        select: {
          roomNumber: true
        }
      }
    }
  });

  const absentStudents = [];
  for (const student of students) {
    const thisStudentPresentDates = new Set(
      student.attendanceRecords.map(attendanceRecord => attendanceRecord.attendanceDate.toISOString().split("T")[0])
    );
    const thisStudentabsentDates = expectedDates.filter(expectedDate => !thisStudentPresentDates.has(expectedDate));

    if (thisStudentabsentDates.length > 0) {
      absentStudents.push({
        studentName: student.studentName,
        rollNumber: student.rollNumber ?? null,
        contactNumber: student.contactNumber,
        roomNumber: student.room.roomNumber,
        department: student.department.departmentName,
        parentMobileNumber: student.parentMobileNumber,
        studentImageUrl: student.studentImageUrl
      });
    }
  }

  const records = absentStudents.slice(
    skip,
    skip + take
  );

  return {
    dbRecords: records,
    dbTotalCount: absentStudents.length
  }
};

const findStudentProfileById = async (studentProfileId) => {
  return await prisma.studentProfile.findUnique({
    where: {
      id: studentProfileId
    }
  });
};


const AttendanceRecordRepository = {
  findHostelById,
  markAttendance,
  getAttendanceRecordsPresent,
  getTotalCountOfAttendanceRecordPresent,
  getTotalOfStudentsOfHostel,
  getTotalOfStudentsWithAtleastOnePresentDuringRange,
  getAbsentStudentsRecord,
  findStudentProfileById
};

export default AttendanceRecordRepository;