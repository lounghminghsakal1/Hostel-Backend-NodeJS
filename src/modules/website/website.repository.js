import { prisma } from "../../configs/db.js";

//all queries are scoped to one hostel (the signed-in admin's or student's)

const countStudentsOfHostel = (hostelId) => {
  return prisma.studentProfile.count({ where: { hostelId } });
};

//one attendance record per student per day (unique constraint), so counting rows counts students
const countAttendanceOnDate = (hostelId, dbDate, extraWhere = {}) => {
  return prisma.attendanceRecord.count({
    where: { attendanceDate: dbDate, student: { hostelId }, ...extraWhere }
  });
};

//present count per night for a date range, in one query
const countAttendancePerDate = async (hostelId, fromDbDate, toDbDate) => {
  const rows = await prisma.attendanceRecord.groupBy({
    by: ["attendanceDate"],
    where: { attendanceDate: { gte: fromDbDate, lte: toDbDate }, student: { hostelId } },
    _count: { _all: true }
  });
  return rows.map(row => ({ attendanceDate: row.attendanceDate, count: row._count._all }));
};

const countPendingLeaveApplications = (hostelId) => {
  return prisma.leaveApplication.count({
    where: { status: "WAITING_FOR_APPROVAL", student: { hostelId } }
  });
};

const findStudentOfHostel = (studentId, hostelId) => {
  return prisma.studentProfile.findFirst({
    where: { id: studentId, hostelId },
    select: {
      id: true,
      createdAt: true,
      hostel: { select: { attendanceMarkingStartTime: true, attendanceMarkingEndTime: true } }
    }
  });
};

const getAttendanceOfStudentBetween = (studentId, fromDbDate, toDbDate) => {
  return prisma.attendanceRecord.findMany({
    where: { studentId, attendanceDate: { gte: fromDbDate, lte: toDbDate } },
    orderBy: { attendanceDate: "desc" },
    select: {
      id: true,
      attendanceDate: true,
      reportedTime: true,
      capturedImageKey: true,
      faceMatchingPercentage: true,
      isLocatedWithinHostelRadius: true,
      locationDeviationFromHostel: true
    }
  });
};

const getApprovedLeavesOfStudentOverlapping = (studentId, fromDbDate, toDbDate) => {
  return prisma.leaveApplication.findMany({
    where: { studentId, status: "APPROVED", fromDate: { lte: toDbDate }, toDate: { gte: fromDbDate } },
    select: { fromDate: true, toDate: true }
  });
};

const getRoomsWithOccupancy = (hostelId) => {
  return prisma.room.findMany({
    where: { hostelId },
    select: { capacity: true, _count: { select: { studentProfiles: true } } }
  });
};

const countAnnouncements = (where) => prisma.announcement.count({ where });
const countEvents = (where) => prisma.upcomingEvent.count({ where });

const getAnnouncementsPreview = (where, take) => {
  return prisma.announcement.findMany({
    where,
    orderBy: [{ isImportant: "desc" }, { startDate: "desc" }, { id: "desc" }],
    take
  });
};

const getEventsPreview = (where, take) => {
  return prisma.upcomingEvent.findMany({
    where,
    orderBy: [{ startingAt: "asc" }, { id: "asc" }],
    take
  });
};

const getStudentsForExport = (where, take) => {
  return prisma.studentProfile.findMany({
    where,
    orderBy: { id: "asc" },
    take,
    select: {
      id: true,
      studentName: true,
      rollNumber: true,
      contactNumber: true,
      parentMobileNumber: true,
      user: { select: { email: true, status: true } },
      department: { select: { id: true, departmentName: true } },
      room: { select: { id: true, roomNumber: true } }
    }
  });
};

const getStudentNameAndRoom = (studentId) => {
  return prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true, studentName: true, room: { select: { roomNumber: true } } }
  });
};

//published bills of the hostel, newest first, with this student's payment (if any)
const getPublishedBillsWithPayment = (hostelId, studentId) => {
  return prisma.monthlyMessBill.findMany({
    where: { hostelId, status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 6,
    select: {
      id: true,
      month: true,
      year: true,
      amount: true,
      lastDate: true,
      status: true,
      messFeePayments: { where: { studentProfileId: studentId }, select: { paidAt: true } }
    }
  });
};

const getLatestLeaveOfStudent = (studentId) => {
  return prisma.leaveApplication.findFirst({
    where: { studentId },
    orderBy: [{ fromDate: "desc" }, { id: "desc" }],
    select: { id: true, fromDate: true, toDate: true, status: true, leaveReason: true }
  });
};

const WebsiteRepository = {
  countStudentsOfHostel,
  countAttendanceOnDate,
  countAttendancePerDate,
  countPendingLeaveApplications,
  findStudentOfHostel,
  getAttendanceOfStudentBetween,
  getApprovedLeavesOfStudentOverlapping,
  getRoomsWithOccupancy,
  countAnnouncements,
  countEvents,
  getAnnouncementsPreview,
  getEventsPreview,
  getStudentsForExport,
  getStudentNameAndRoom,
  getPublishedBillsWithPayment,
  getLatestLeaveOfStudent
};

export default WebsiteRepository;
