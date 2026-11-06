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

const getAttendanceRecordsPresent = async (attendanceWhere, skip, take, orderBy = [{ reportedTime: "desc" }, { id: "desc" }]) => {
  const result = await prisma.attendanceRecord.findMany({
    where: attendanceWhere,
    orderBy,
    include: {
      student: {
        select: {
          studentName: true,
          rollNumber: true,
          studentImageKey: true,
          contactNumber: true,
          parentMobileNumber: true,
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

const getTotalOfStudentsOfHostel = async (studentWhere) => {
  return await prisma.studentProfile.count({
    where: studentWhere
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

const getAbsentStudentsRecord = async (hostelId, expectedDates, studentWhere ,skip, take) => {
  const students = await prisma.studentProfile.findMany({
    where: studentWhere,
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
        id: student.id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        contactNumber: student.contactNumber,
        roomNumber: student?.room?.roomNumber ?? null,
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

const totalCountOfStudentsInOneHostel = async (hostelId) => {
  return prisma.studentProfile.count({
    where: {
      hostelId
    }
  });
};

//attendanceDate must be the IST calendar date as a db date (see currentDateForDb)
const findAttendanceOfStudentOnDate = async (studentProfileId, attendanceDate) => {
  return await prisma.attendanceRecord.findFirst({
    where: {
      studentId: studentProfileId,
      attendanceDate
    },
    select: {
      id: true
    }
  });
};


//recent check-in selfies of a student that matched their registered photo well
//(sent to the face server as extra references, so a new beard or haircut doesn't drop the score)
const getRecentTrustedCapturesOfStudent = async (studentProfileId, sinceDate, minFaceMatchingPercentage, take) => {
  return await prisma.attendanceRecord.findMany({
    where: {
      studentId: studentProfileId,
      attendanceDate: { gte: sinceDate },
      faceMatchingPercentage: { gte: minFaceMatchingPercentage }
    },
    orderBy: { attendanceDate: "desc" },
    select: { capturedImageKey: true },
    take
  });
};

const AttendanceRecordRepository = {
  getRecentTrustedCapturesOfStudent,
  findHostelById,
  findAttendanceOfStudentOnDate,
  markAttendance,
  getAttendanceRecordsPresent,
  getTotalCountOfAttendanceRecordPresent,
  getTotalOfStudentsOfHostel,
  getTotalOfStudentsWithAtleastOnePresentDuringRange,
  getAbsentStudentsRecord,
  findStudentProfileById,
  totalCountOfStudentsInOneHostel
};

export default AttendanceRecordRepository;