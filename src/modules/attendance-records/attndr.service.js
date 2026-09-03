import createHttpError from "http-errors";
import AttendanceRecordRepository from "./attndr.repository.js";
import { buildMeta, toPrismaPagination } from "../../utils/pagination.utils.js";

const markAttendance = async (accessContext, markAttendanceRequestBody) => {
  const {
    capturedImageUrl,
    latitude,
    longitude,
  } = markAttendanceRequestBody;
  // check configured attendance time is past or not 
  // that is students can mark attendance only after night 8:30 pm and this time can be configured by hostel admin
  const hostel = await AttendanceRecordRepository.findHostelById(accessContext.loggedInStudentHostelId);
  if (!hostel) throw createHttpError(404, `Hostel with hostel id ${accessContext.loggedInStudentHostelId} not found`, { errors: "Invalid request" });

  //"en-GB" is for formatting , here en-GB is refering british format because they represent time in 24 hour format and dd/mm/yyyy format
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date());

  //en-CA format is -> yyyy-mm-dd so that it can be useful in filtering and other db related stuffs
  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());


  if (currentTime < hostel.attendanceMarkingStartTime) throw createHttpError(422, `Attendance marking time hasn't come yet, wait until ${hostel.attendanceMarkingStartTime}`, { errors: "Invalid request (start time haven't arrived yet)" });
  if (currentTime > hostel.attendanceMarkingEndTime) throw createHttpError(422, `Attendance marking end time (${hostel.attendanceMarkingEndTime}) has already passed`, { errors: "Invalid request (end time passed)" });

  let isLocatedWithinHostelRadius;
  //latitude and longitude processing
  const locationDeviationFromHostel = calculateLocationFromHostel(latitude, longitude, hostel);
  if (locationDeviationFromHostel > hostel.attendanceRadius) {
    isLocatedWithinHostelRadius = false;
  } else {
    isLocatedWithinHostelRadius = true;
  }

  let faceMatchingPercentage = 90;
  //Image processing ()



  //creating attendance record in DB
  const createdAttendanceRecord = await AttendanceRecordRepository.markAttendance(currentDate, capturedImageUrl, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, accessContext.loggedInStudentProfileId);

  return createdAttendanceRecord;
};

const calculateDistanceFromHostelInMeteres = (latitude, longitude, hostel) => {
  const EARTH_RADIUS_IN_METERES = 6371000;
  const toRadians = (degree) => degree * (Math.PI / 180);

  const capturedLatitude = toRadians(latitude);
  const hostelLatitude = toRadians(hostel.latitude);

  const capturedLongitude = toRadians(longitude);
  const hostelLongitude = toRadians(hostel.longitude);


  //difference between latitudes and longitudes
  const deltaLat = hostelLatitude - capturedLatitude;
  const deltaLong = hostelLongitude - capturedLongitude;

  // FORMULA -> distance between 2 coordinates , we can't use distance btw 2 points because earth is not flat
  // Haversine formula -> Distance = 2 * R * arcsin(Math.sqrt(sin^2(deltaLat/2) + cos(lat1) cos(lat2) sin^2(deltaLong/2)))
  // here R is the radius of earth

  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(capturedLatitude) *
    Math.cos(hostelLatitude) *
    Math.sin(deltaLong / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_IN_METERES * c;
};

const getAttendanceRecords = async (accessContext, attendanceQuery) => {
  const {
    date,
    fromDate,
    toDate,
    status,
    page,
    pageSize
  } = attendanceQuery;

  if (date && (fromDate || toDate)) throw createHttpError(422, "Both date and range dates(from date and to date) cannot present at the same time", { errors: "Invalid query params" });

  if ((fromDate && !toDate) || (!fromDate && toDate)) throw createHttpError(422, "For date range filters, both fromDate and toDate are required");
  //here for attendance marked students -> i need to show them in a table in UI
  // the UI table columns are -> student_name, rollNumber, roomNumber, capturedImage, faceMatchingPercentage, locationdeviationFromHostel, location_coordinates_link(navigates to map), 
  //and for absent (who has no records during the particular date or during date range (if atleast one absent during those days))
  //in that case UI table columns are -> student_name, rollNumber, roomNumber, department, absentdates(popup if its more than certain number of dates)

  //so i need just total students count, attendance marked students count, absent count as normal data and the main data is above columns based on status 
  //constructing where 
  let where = {};
  where.attendanceDate = date ?? new Date();
  // if (fromDate && toDate) {
  //   where.fromDate = fromDate;
  //   where.toDate = toDate;
  // }
  // if (status) where.status = status;
  const paginationQuery = toPrismaPagination(page, pageSize);

  //adding scope access to where 
  where = { ...where, student: { hostelId: accessContext.loggedInAdminHostelId } };
  //getting summary - total students count, attendance marked students count, absent count
  const totalStudentProfiles = await AttendanceRecordRepository.getTotalStudentsCount(accessContext.loggedInAdminHostelId);
  const attendanceMarkedStudentsCount = await AttendanceRecordRepository.getAttendanceMarkedStudentsCount(where, paginationQuery);
  const absentsStudentsCount = totalStudentProfiles - attendanceMarkedStudentsCount;

  let studentsAttendanceRecords;
  if (status === "absent") {
    //getting absent students data
    studentsAttendanceRecords = null; // later
  } else {
    //getting present students
    studentsAttendanceRecords = await AttendanceRecordRepository.getAllMarkedAttendanceRecords(where);
  }
  //constructing data
  const attendanceRecords = {
    summary: {
      totalStudentProfiles,
      attendanceMarkedStudentsCount,
      absentsStudentsCount
    },
    studentsAttendanceRecords,
  };
  //pagination meta data 
  const paginationMeta = buildMeta(page, pageSize, studentsAttendanceRecords.length);

  return {
    attendanceRecords,
    paginationMeta
  };
};

const AttendanceRecordService = {
  markAttendance,
  getAttendanceRecords,
};

export default AttendanceRecordService;