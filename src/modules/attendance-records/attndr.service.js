import createHttpError from "http-errors";
import AttendanceRecordRepository from "./attndr.repository.js";
import { buildMeta, paginationQuerySchema, toPrismaPagination } from "../../utils/pagination.utils.js";
import { currentDate, currentTime, getDateRange, getDatesListBetween } from "../../utils/dates.utils.js";
//, getDatesListBetween

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

  // if (currentTime() < hostel.attendanceMarkingStartTime) throw createHttpError(422, `Attendance marking time hasn't come yet, wait until ${hostel.attendanceMarkingStartTime}`, { errors: "Invalid request (start time haven't arrived yet)" });
  // if (currentTime() > hostel.attendanceMarkingEndTime) throw createHttpError(422, `Attendance marking end time (${hostel.attendanceMarkingEndTime}) has already passed`, { errors: "Invalid request (end time passed)" });

  //latitude and longitude processing
  const locationDeviationFromHostel = calculateDistanceFromHostelInMeters(latitude, longitude, hostel);
  const isLocatedWithinHostelRadius = locationDeviationFromHostel <= hostel.attendanceRadius;

  //Image processing ()

  //fetch student record to get base image
  let faceMatchingPercentage = 0;
  const student = await AttendanceRecordRepository.findStudentProfileById(accessContext.loggedInStudentProfileId);

  if (!student.studentImageUrl) {

  }

  //check whether face verfication server(python fast api server is running or not)
  const faceVerfificationServerResponse = fetch("http://127.0.0.1:8000/health", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.json());

  if (faceVerfificationServerResponse.model_loaded === false) {
    throw createHttpError(500, "Face verification python fast api server is not running", { errors: "Python fast api - Face verification server error" });
  }

  const resultOfFaceVerification = fetch("http://127.0.0.1:8000/face/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "base_image": student.studentImageUrl,
      "captured_image": capturedImageUrl,
      "threshold": 0.5
    })
  }).then(res => res.json());

  faceMatchingPercentage = resultOfFaceVerification.face_matching_percentage ?? 0;

  //creating attendance record in DB
  const createdAttendanceRecord = await AttendanceRecordRepository.markAttendance(new Date(), capturedImageUrl, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, accessContext.loggedInStudentProfileId);

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

  const {
    date,
    fromDate,
    toDate,
    status = "present",
    page,
    pageSize
  } = attendanceQuery;
  
  //query validations
  if (date && (fromDate || toDate)) throw createHttpError(422, "Both date filter and range filter cannot exist simultaneously", { errors: "Invalid date filters" });
  if ((fromDate || toDate) && ((fromDate && !toDate) || (!fromDate && toDate))) throw createHttpError(422, "Both fromDate and toDate is required for range date filter", { errors: "Invalid date filters" });
  if (fromDate > toDate) throw createHttpError(422, "From date must be past to to date", { errors: "Invalid range date filters" });

  //resolving range date (fromDate and toDate) for where clause
  let attendanceWhere;
  let startDate, endDate;

  if (date) {
    ({ startDate, endDate } = getDateRange(date, date));
  } else if (fromDate && toDate) {
    ({ startDate, endDate } = getDateRange(fromDate, toDate));
  } else {
    ({ startDate, endDate } = getDateRange(currentDate()));
  }

  attendanceWhere = {
    attendanceDate: {
      gte: startDate,
      lt: endDate
    }
  };

  //attaching hostel scope to attendanceWhere
  const hostelId = accessContext.loggedInAdminHostelId;
  attendanceWhere.hostelId = hostelId;

  //get prisma pagination to query in database
  const prismaPagination = toPrismaPagination(page, pageSize);

  //records based on present or absent
  let records;
  let totalCount;

  if (status === "absent") {
    const datesList = getDatesListBetween(startDate, endDate);
    const { dbRecords, dbTotalCount } = await AttendanceRecordRepository.getAbsentStudentsRecord(hostelId, datesList);
    records = dbRecords;
    totalCount = dbTotalCount;
  } else {
    [records, totalCount] = await Promise.all(
      [
        AttendanceRecordRepository.getAttendanceRecordsPresent(attendanceWhere, prismaPagination.skip, prismaPagination.take),
        AttendanceRecordRepository.getTotalCountOfAttendanceRecordPresent(attendanceWhere)
      ]
    );
  }

  // get Summary 
  const totalStudentsOfTheHostel = await AttendanceRecordRepository.getTotalOfStudentsOfHostel(hostelId);
  const totalStudentsWithatleastOnePresentDuringDateFilter = await AttendanceRecordRepository.getTotalOfStudentsWithAtleastOnePresentDuringRange(attendanceWhere);
  const completelyAbsentStudentsCountDuringDates = totalStudentsOfTheHostel - totalStudentsWithatleastOnePresentDuringDateFilter;

  //get pagination meta
  const paginationMeta = buildMeta(page, pageSize, totalCount);

  return {
    records: {
      summary: {
        totalStudentsOfTheHostel,
        totalStudentsWithatleastOnePresentDuringDateFilter,
        completelyAbsentStudentsCountDuringDates
      },
      attendanceRecords: records
    },
    paginationMeta
  };
};



const AttendanceRecordService = {
  markAttendance,
  getAttendanceRecords
};

export default AttendanceRecordService;