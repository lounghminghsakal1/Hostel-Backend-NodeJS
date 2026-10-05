import { prisma } from "../../configs/db.js";

const findHostelById = async (id) => {
  return await prisma.hostel.findUnique({
    where: {
      id: id
    }
  });
};

const markAttendance = async (currentDate, capturedImageKey, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, loggedInStudentProfileId) => {
  return await prisma.attendanceRecord.create({
    data: {
      attendanceDate: currentDate,
      capturedImageKey: capturedImageKey,
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
  const result = await prisma.attendanceRecord.findMany({
    where: attendanceWhere,
    include: {
      student: {
        select: {
          studentName: true,
          rollNumber: true,
          studentImageKey: true,
          room: {
            select: {
              roomNumber: true
            }
          }
        }
      }
    },
    skip,
    take
  });
  return result;
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
  const students = await prisma.attendanceRecord.findMany({
    where: attendanceWhere,
    select: {
      studentId: true
    },
    distinct: ["studentId"]
  });

  return students.length;
};

const getAbsentStudentsRecord = async (hostelId, expectedDates, skip, take) => {
  const students = await prisma.studentProfile.findMany({
    where: {
      hostelId
    },
    include: {
      attendanceRecords: {
        select: {
          attendanceDate: true
        }
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
        rollNumber: student.rollNumber,
        contactNumber: student.contactNumber,
        roomNumber: student?.room.roomNumber ?? null,
        department: student.department.departmentName,
        parentMobileNumber: student.parentMobileNumber,
        studentImageKey: student.studentImageKey,
        absentDates: thisStudentabsentDates
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