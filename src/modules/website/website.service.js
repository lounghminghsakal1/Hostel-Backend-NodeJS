import createHttpError from "http-errors";
import { currentDate, getAttendanceWindowState } from "../../utils/dates.utils.js";
import { announcementVisibilityWhere, liveAnnouncementWhere, visibleEventWhere } from "../../utils/notice-visibility.utils.js";
import WebsiteRepository from "./website.repository.js";

//data the website shows on wide screens, each in one request instead of several list calls

//face match below this is flagged (65%+ is trusted, the same rule as the app)
const FACE_TRUSTED_THRESHOLD = 65;
//cap for CSV export, so one request can't pull an unbounded number of rows
const EXPORT_LIMIT = 5000;

//"2026-11-04" <-> Date for @db.Date columns (stored as UTC midnight of the IST calendar day)
const toDbDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`);
const isoOf = (date) => date.toISOString().slice(0, 10);
const addDays = (isoDate, days) => {
  const date = toDbDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return isoOf(date);
};
const datesBetween = (fromIso, toIso) => {
  const dates = [];
  for (let d = fromIso; d <= toIso; d = addDays(d, 1)) dates.push(d);
  return dates;
};
const istDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

const requireAdminHostel = (accessContext) => {
  const hostelId = accessContext.loggedInAdminHostelId;
  if (!hostelId) throw createHttpError(403, "Only hostel admins can see this", { errors: "Not a hostel admin" });
  return hostelId;
};

//GET /website/dashboard: tonight's numbers, what needs attention, and the last N nights
const getDashboard = async (accessContext, { date, days }) => {
  const hostelId = requireAdminHostel(accessContext);
  const today = currentDate();
  const day = date ?? today;
  if (day > today) throw createHttpError(422, "The date can't be in the future", { errors: "Invalid date" });

  const fromDay = addDays(day, -(days - 1));
  const dayDb = toDbDate(day);

  const [totalStudents, present, faceBelowThreshold, outsideHostel, pendingLeaveRequests, perDate] = await Promise.all([
    WebsiteRepository.countStudentsOfHostel(hostelId),
    WebsiteRepository.countAttendanceOnDate(hostelId, dayDb),
    WebsiteRepository.countAttendanceOnDate(hostelId, dayDb, { faceMatchingPercentage: { lt: FACE_TRUSTED_THRESHOLD } }),
    WebsiteRepository.countAttendanceOnDate(hostelId, dayDb, { isLocatedWithinHostelRadius: false }),
    WebsiteRepository.countPendingLeaveApplications(hostelId),
    WebsiteRepository.countAttendancePerDate(hostelId, toDbDate(fromDay), dayDb)
  ]);

  const presentByDate = new Map(perDate.map(row => [isoOf(row.attendanceDate), row.count]));

  return {
    date: day,
    totalStudents,
    present,
    absent: Math.max(0, totalStudents - present),
    faceThreshold: FACE_TRUSTED_THRESHOLD,
    faceBelowThreshold,
    outsideHostel,
    pendingLeaveRequests,
    //"total" is today's student count (the same base the attendance list summary uses)
    trend: datesBetween(fromDay, day).map(d => ({ date: d, present: presentByDate.get(d) ?? 0, total: totalStudents }))
  };
};

//GET /website/nav-counts: badges in the website's navigation
const getNavCounts = async (accessContext) => {
  const hostelId = requireAdminHostel(accessContext);
  return { pendingLeaveRequests: await WebsiteRepository.countPendingLeaveApplications(hostelId) };
};

//GET /website/students/:id/attendance-history: every night of the last N days, plus recent check-ins
const getStudentAttendanceHistory = async (accessContext, studentId, { days }) => {
  const hostelId = requireAdminHostel(accessContext);
  if (!Number.isInteger(studentId) || studentId < 1) throw createHttpError(422, "Invalid student id", { errors: "Invalid student id" });

  const student = await WebsiteRepository.findStudentOfHostel(studentId, hostelId);
  if (!student) throw createHttpError(404, `Student with id ${studentId} is not found`, { errors: "Student id not found in the database" });

  const toDay = currentDate();
  const fromDay = addDays(toDay, -(days - 1));
  const [records, approvedLeaves] = await Promise.all([
    WebsiteRepository.getAttendanceOfStudentBetween(studentId, toDbDate(fromDay), toDbDate(toDay)),
    WebsiteRepository.getApprovedLeavesOfStudentOverlapping(studentId, toDbDate(fromDay), toDbDate(toDay))
  ]);

  const presentDates = new Set(records.map(record => isoOf(record.attendanceDate)));
  const leaveRanges = approvedLeaves.map(leave => ({ from: isoOf(leave.fromDate), to: isoOf(leave.toDate) }));
  const onLeave = (d) => leaveRanges.some(range => d >= range.from && d <= range.to);
  const joinedOn = istDateFormatter.format(student.createdAt);
  const tonightClosed = getAttendanceWindowState(
    student.hostel.attendanceMarkingStartTime,
    student.hostel.attendanceMarkingEndTime
  ) === "CLOSED";

  //present > on leave > not yet a student > tonight still open > absent
  const nights = datesBetween(fromDay, toDay).map(d => {
    let status = "absent";
    if (presentDates.has(d)) status = "present";
    else if (onLeave(d)) status = "leave";
    else if (d < joinedOn) status = "not_joined";
    else if (d === toDay && !tonightClosed) status = "pending";
    return { date: d, status };
  });

  const presentCount = nights.filter(night => night.status === "present").length;
  const absentCount = nights.filter(night => night.status === "absent").length;
  const leaveCount = nights.filter(night => night.status === "leave").length;
  const counted = presentCount + absentCount;

  return {
    fromDate: fromDay,
    toDate: toDay,
    presentCount,
    absentCount,
    leaveCount,
    percentPresent: counted ? Math.round((presentCount / counted) * 100) : null,
    nights,
    recentCheckIns: records.slice(0, 6)
  };
};

//GET /website/rooms/summary: totals across all rooms of the hostel
const getRoomsSummary = async (accessContext) => {
  const hostelId = requireAdminHostel(accessContext);
  const rooms = await WebsiteRepository.getRoomsWithOccupancy(hostelId);
  const beds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupied = rooms.reduce((sum, room) => sum + room._count.studentProfiles, 0);
  return {
    rooms: rooms.length,
    beds,
    occupied,
    freeBeds: Math.max(0, beds - occupied),
    roomsWithFreeBeds: rooms.filter(room => room._count.studentProfiles < room.capacity).length
  };
};

//GET /website/notices/summary: counts for the filter chips and what students see right now
const getNoticesSummary = async (accessContext) => {
  const hostelId = requireAdminHostel(accessContext);
  const now = new Date();
  const scoped = (where) => ({ hostelId, ...where });

  const [live, scheduled, expired, hidden, totalAnnouncements, liveEvents, upcomingEvents, endedEvents, hiddenEvents, totalEvents, previewAnnouncements, previewEvents] = await Promise.all([
    WebsiteRepository.countAnnouncements(scoped(announcementVisibilityWhere("live"))),
    WebsiteRepository.countAnnouncements(scoped(announcementVisibilityWhere("scheduled"))),
    WebsiteRepository.countAnnouncements(scoped(announcementVisibilityWhere("expired"))),
    WebsiteRepository.countAnnouncements(scoped(announcementVisibilityWhere("off"))),
    WebsiteRepository.countAnnouncements({ hostelId }),
    WebsiteRepository.countEvents(scoped({ isActive: true, startingAt: { lte: now }, endingAt: { gt: now } })),
    WebsiteRepository.countEvents(scoped({ isActive: true, startingAt: { gt: now } })),
    WebsiteRepository.countEvents(scoped({ isActive: true, endingAt: { lte: now } })),
    WebsiteRepository.countEvents(scoped({ isActive: false })),
    WebsiteRepository.countEvents({ hostelId }),
    WebsiteRepository.getAnnouncementsPreview(scoped(liveAnnouncementWhere()), 3),
    WebsiteRepository.getEventsPreview(scoped(visibleEventWhere()), 3)
  ]);

  return {
    announcements: { live, scheduled, expired, hidden, total: totalAnnouncements },
    events: { live: liveEvents, upcoming: upcomingEvents, ended: endedEvents, hidden: hiddenEvents, total: totalEvents },
    studentPreview: { announcements: previewAnnouncements, events: previewEvents }
  };
};

//GET /website/students/export: every student matching the list filters, for a CSV file
const exportStudents = async (accessContext, query) => {
  const hostelId = requireAdminHostel(accessContext);
  const { by_student_name, by_department_id, by_room_id, by_roll_number } = query;

  const where = { hostelId };
  if (by_student_name?.trim()) where.studentName = { contains: by_student_name.trim(), mode: "insensitive" };
  if (by_roll_number?.trim()) where.rollNumber = by_roll_number.trim();
  if (by_department_id > 0) where.departmentId = by_department_id;
  if (by_room_id > 0) where.roomId = by_room_id;

  const students = await WebsiteRepository.getStudentsForExport(where, EXPORT_LIMIT + 1);
  return { students: students.slice(0, EXPORT_LIMIT), truncated: students.length > EXPORT_LIMIT };
};

//GET /website/students/me/summary (student): name and room, the bill to pay, and the latest leave
const getMyStudentSummary = async (accessContext) => {
  const studentId = accessContext.loggedInStudentProfileId;
  const hostelId = accessContext.loggedInStudentHostelId;
  if (!studentId || !hostelId) throw createHttpError(403, "Only students can see this", { errors: "Not a student" });

  const [profile, bills, latestLeave] = await Promise.all([
    WebsiteRepository.getStudentNameAndRoom(studentId),
    WebsiteRepository.getPublishedBillsWithPayment(hostelId, studentId),
    WebsiteRepository.getLatestLeaveOfStudent(studentId)
  ]);

  const due = bills.find(bill => bill.messFeePayments.length === 0);
  return {
    studentName: profile?.studentName ?? null,
    roomNumber: profile?.room?.roomNumber ?? null,
    dueBill: due ? { id: due.id, month: due.month, year: due.year, amount: due.amount, lastDate: due.lastDate, status: due.status } : null,
    latestLeave: latestLeave ?? null
  };
};

const WebsiteService = {
  getDashboard,
  getNavCounts,
  getStudentAttendanceHistory,
  getRoomsSummary,
  getNoticesSummary,
  exportStudents,
  getMyStudentSummary
};

export default WebsiteService;
