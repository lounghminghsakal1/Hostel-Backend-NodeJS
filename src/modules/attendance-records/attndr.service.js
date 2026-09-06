import createHttpError from "http-errors";
import AttendanceRecordRepository from "./attndr.repository.js";
import { buildMeta, paginationQuerySchema, toPrismaPagination } from "../../utils/pagination.utils.js";
import { currentDate, currentTime, getDateRange, getDatesListBetween } from "../../utils/dates.utils.js";

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

  if (currentTime < hostel.attendanceMarkingStartTime) throw createHttpError(422, `Attendance marking time hasn't come yet, wait until ${hostel.attendanceMarkingStartTime}`, { errors: "Invalid request (start time haven't arrived yet)" });
  if (currentTime > hostel.attendanceMarkingEndTime) throw createHttpError(422, `Attendance marking end time (${hostel.attendanceMarkingEndTime}) has already passed`, { errors: "Invalid request (end time passed)" });

  //latitude and longitude processing
  const locationDeviationFromHostel = calculateDistanceFromHostelInMeters(latitude, longitude, hostel);
  const isLocatedWithinHostelRadius = locationDeviationFromHostel <= hostel.attendanceRadius;

  let faceMatchingPercentage = 90;
  //Image processing ()



  //creating attendance record in DB
  const createdAttendanceRecord = await AttendanceRecordRepository.markAttendance(currentDate, capturedImageUrl, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, accessContext.loggedInStudentProfileId);

  return createdAttendanceRecord;
};

const calculateDistanceFromHostelInMeters = (latitude, longitude, hostel) => {
  const EARTH_RADIUS_IN_METERS = 6371000;
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

  return EARTH_RADIUS_IN_METERS * c;
};

const getAttendanceRecords = async (accessContext, attendanceQuery) => {
  //here for attendance marked students -> i need to show them in a table in UI
  // the UI table columns are -> student_name, rollNumber, roomNumber, capturedImage, faceMatchingPercentage, locationdeviationFromHostel, location_coordinates_link(navigates to map), 
  //and for absent (who has no records during the particular date or during date range (if atleast one absent during those days))
  //in that case UI table columns are -> student_name, rollNumber, roomNumber, department, absentdates(popup if its more than certain number of dates)

  //so i need just total students count, attendance marked students count, absent count as normal data and the main data is above columns based on status 

  //queries
  const {
    date,
    fromDate,
    toDate,
    status = "present",
    page,
    pageSize
  } = attendanceQuery;

  //query validations
  //1. date filter and range date filter cannot exist simultaneously
  if (date && (fromDate || toDate)) throw createHttpError(422, "Both date and range dates(from and to date) filters can't be present at the same time in query", { errors: "invalid query" });
  //2.from date and todate both must be present if opt for range filter(only one is provided like either fromdate or todate so it should not be like that)
  if ((fromDate || toDate) && ((fromDate && !toDate) || (!fromDate || toDate))) throw createHttpError(422, "Both from date and to date must be present for range date filters", { errors: "Invalid query" });
  //3.fromdate must be past to todate
  if ((fromDate && toDate) && new Date(fromDate) > new Date(toDate)) throw createHttpError(422, "From date should be past to to date", { errors: "Invalid query" });

  //constructing date of where query
  let attendanceWhere;
  let startDate, endDate, rawStartDate, rawEndDate;

  if (date) {
    rawStartDate = date;
    rawEndDate = date;
    ({ startDate, endDate } = getDateRange(date, date));
  } else if (fromDate && toDate) {
    rawStartDate = fromDate;
    rawEndDate = endDate;
    ({ startDate, endDate } = getDateRange(fromDate, toDate));
  } else {
    rawStartDate = currentDate;
    rawEndDate = currentDate;
    ({ startDate, endDate } = getDateRange(currentDate));
  }

  //Expected dates as array of strings
  const expectedDatesStrings = getDatesListBetween(rawStartDate, rawEndDate);
  const totalExpectedDays = expectedDatesStrings.length;
  const hostelId = accessContext.loggedInAdminHostelId;

  attendanceWhere = {
    attendanceDate: {
      gte: startDate,
      lt: endDate
    },
    student: {
      hostelId: hostelId
    }
  };
  //pagination query 
  const prismaPaginationQuery = toPrismaPagination(page, pageSize);

  //based on status , query records
  let records;
  let totalRecordsForPagination;
  if (status === "absent") {
    // here i need expected attendance records count so based on that only i can query because our requirement is for a range date query for example -> from sept 10 to sept 14 the students who absent for atleast 1 day should be included in this record
    ({totalRecordsForPagination, records} = await AttendanceRecordRepository.getStudentsWithAbsenses(hostelId, startDate, endDate, expectedDatesStrings, totalExpectedDays, prismaPaginationQuery.skip, prismaPaginationQuery.take));
  } else {
    records = await AttendanceRecordRepository.getAllMarkedAttendanceRecords(attendanceWhere, prismaPaginationQuery.skip, prismaPaginationQuery.take);
  }


  //get summary data
  const totalStudentsCount = await AttendanceRecordRepository.getTotalStudentsCount(hostelId);
  const distinctAttendanceStudentsCount = await AttendanceRecordRepository.getDistinctAttendanceMarketStudentsCount(attendanceWhere, hostelId);
  const completelyAbsentStudentsCount = totalStudentsCount - distinctAttendanceStudentsCount;


  //getPaginationMeta
  const paginationMeta = buildMeta(page, pageSize, records.length);

  return {
    records: {
      records,
      summary: {
        totalStudentsCount,
        distinctAttendanceStudentsCount,
        completelyAbsentStudentsCount
      }
    },
    paginationMeta: paginationMeta
  };
};

const AttendanceRecordService = {
  markAttendance,
  getAttendanceRecords,
};

export default AttendanceRecordService;