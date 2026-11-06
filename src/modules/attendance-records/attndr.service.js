import createHttpError from "http-errors";
import AttendanceRecordRepository from "./attndr.repository.js";
import { buildMeta, paginationQuerySchema, toPrismaPagination } from "../../utils/pagination.utils.js";
import { currentDate, currentDateForDb, getAttendanceWindowState, getDateRange, getDatesListBetween } from "../../utils/dates.utils.js";
import { getS3SignedUrlByKey } from "../../utils/helper-functions.utils.js";
import { faceServerUrl as getFaceServerUrl } from "../../services/face-server.service.js";
//, getDatesListBetween

const markAttendance = async (accessContext, markAttendanceRequestBody) => {
  const {
    capturedImageKey,
    latitude,
    longitude,
  } = markAttendanceRequestBody;
  // check configured attendance time is past or not 
  // that is students can mark attendance only after night 8:30 pm and this time can be configured by hostel admin
  const hostel = await AttendanceRecordRepository.findHostelById(accessContext.loggedInStudentHostelId);
  if (!hostel) throw createHttpError(404, `Hostel with hostel id ${accessContext.loggedInStudentHostelId} not found`, { errors: "Invalid request" });

  //attendance can be marked only inside the hostel's window (IST) - same rule the splash screen uses to show the button
  const windowState = getAttendanceWindowState(hostel.attendanceMarkingStartTime, hostel.attendanceMarkingEndTime);
  if (windowState === "NOT_OPEN_YET") throw createHttpError(422, `Attendance marking hasn't opened yet, it opens at ${hostel.attendanceMarkingStartTime}`, { errors: "Attendance window not open yet" });
  if (windowState === "CLOSED") throw createHttpError(422, `Attendance marking closed at ${hostel.attendanceMarkingEndTime}`, { errors: "Attendance window closed" });

  //one record per student per day (IST calendar date) - check before calling the face verification server
  const todayIst = currentDateForDb();
  const alreadyMarked = await AttendanceRecordRepository.findAttendanceOfStudentOnDate(accessContext.loggedInStudentProfileId, todayIst);
  if (alreadyMarked) throw createHttpError(409, "Attendance is already marked for today", { errors: "Attendance already marked" });

  //latitude and longitude processing
  const locationDeviationFromHostel = calculateDistanceFromHostelInMeters(latitude, longitude, hostel);
  const isLocatedWithinHostelRadius = locationDeviationFromHostel <= hostel.attendanceRadius;

  //Image processing ()

  //fetch student record to get base image
  let faceMatchingPercentage = 0;
  const student = await AttendanceRecordRepository.findStudentProfileById(accessContext.loggedInStudentProfileId);

  if (!student.studentImageKey) {
    throw createHttpError(409, "Student image is not uploaded yet, ask your hostel manager for details", { errors: "Student's image not uploaded" });
  }

  //recent check-ins that matched the registered photo strongly help with changes in look (beard, moustache, haircut)
  const sinceDate = new Date(todayIst.getTime() - FACE_REFERENCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const recentTrustedCaptures = await AttendanceRecordRepository.getRecentTrustedCapturesOfStudent(accessContext.loggedInStudentProfileId, sinceDate, FACE_REFERENCE_MIN_PERCENTAGE, FACE_REFERENCE_COUNT);

  faceMatchingPercentage = await verifyFace(student.studentImageKey, capturedImageKey, recentTrustedCaptures.map(record => record.capturedImageKey));

  //creating attendance record in DB
  const createdAttendanceRecord = await AttendanceRecordRepository.markAttendance(todayIst, capturedImageKey, faceMatchingPercentage, latitude, longitude, isLocatedWithinHostelRadius, locationDeviationFromHostel, accessContext.loggedInStudentProfileId);

  return createdAttendanceRecord;
};

//face match percentage bands (the python server's percentage is calibrated to these):
//65+ trusted (green), 30-65 check the photos (yellow), below 30 likely someone else (red)
const FACE_REFERENCE_MIN_PERCENTAGE = 80; //only clearly trusted check-ins are used as references
const FACE_REFERENCE_LOOKBACK_DAYS = 30;
const FACE_REFERENCE_COUNT = 3;

//calls the python fast api face verification server and returns the matching percentage
//if the server is down or slow, the student gets a clear 503 instead of an internal error
//if the selfie has no clear face (or someone else is in it), the student gets a 422 and can retake it - nothing is saved
//if the registered photo has no clear face, the student is told to ask the hostel office for a new photo
const verifyFace = async (baseImageKey, capturedImageKey, referenceImageKeys = []) => {
  const faceServerUrl = getFaceServerUrl();
  const unavailable = () => createHttpError(503, "Face verification is unavailable right now, please try again in a few minutes", { errors: "Face verification server unavailable" });

  try {
    const health = await fetch(`${faceServerUrl}/health`, { signal: AbortSignal.timeout(5000) }).then(res => res.json());
    if (health.model_loaded === false) throw unavailable();

    const result = await fetch(`${faceServerUrl}/face/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "base_image": await getS3SignedUrlByKey(baseImageKey),
        "captured_image": await getS3SignedUrlByKey(capturedImageKey),
        "reference_images": await Promise.all(referenceImageKeys.map(key => getS3SignedUrlByKey(key)))
      }),
      signal: AbortSignal.timeout(20000)
    }).then(res => res.json());

    switch (result.status) {
      case "NO_FACE_IN_CAPTURE":
      case "CAPTURED_IMAGE_UNREADABLE":
        throw createHttpError(422, "We couldn't see your face clearly. Retake the selfie in good light, facing the camera.", { errors: "Face not detected in selfie" });
      case "MULTIPLE_FACES_IN_CAPTURE":
        throw createHttpError(422, "More than one face is in the selfie. Retake it with only you in the frame.", { errors: "Multiple faces in selfie" });
      case "LOW_QUALITY_CAPTURE":
        //too dark, blurry, far away or turned away - the face server says what to fix
        throw createHttpError(422, result.message || "The selfie isn't clear enough. Retake it in good light, facing the camera.", { errors: "Selfie not clear enough" });
      case "NO_FACE_IN_BASE":
      case "MULTIPLE_FACES_IN_BASE":
      case "BASE_IMAGE_UNREADABLE":
        throw createHttpError(409, "Your profile photo on file doesn't show one clear face. Ask the hostel office to upload a new photo.", { errors: "Student's image has no clear face" });
      case "PROCESSING_ERROR":
        throw unavailable();
    }

    if (typeof result.face_matching_percentage !== "number") throw unavailable();
    return result.face_matching_percentage;
  } catch (err) {
    if (createHttpError.isHttpError(err)) throw err;
    console.error("Face verification failed:", err);
    throw unavailable();
  }
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
    by_student_name,
    by_student_department_id,
    by_student_room_id,
    by_roll_number,
    by_face_matching_percentage,
    face_matching_operator,
    is_outside_hostel,
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

  //face match and outside-hostel filters only narrow the present list; the summary counts ignore them
  //(otherwise "below 65%" would shrink the Present count and inflate the Absent count)
  const recordFilters = {};
  const hasFaceFilter = Number(by_face_matching_percentage) >= 0 && Number(by_face_matching_percentage) <= 100;
  if (hasFaceFilter) {
    recordFilters.faceMatchingPercentage = {
      [face_matching_operator]: by_face_matching_percentage
    }
  }

  if (is_outside_hostel !== undefined) {
    recordFilters.isLocatedWithinHostelRadius =
      !is_outside_hostel;
  }

  //attaching hostel scope to attendanceWhere
  const hostelId = accessContext.loggedInAdminHostelId;
  let studentWhere = { hostelId };
  if (by_student_name?.trim()) {
    studentWhere.studentName = {
      contains: by_student_name.trim(),
      mode: "insensitive"
    }
  }
  if (by_roll_number?.trim()) {
    studentWhere.rollNumber = {
      equals: by_roll_number.trim()
    }
  }
  if (Number(by_student_department_id) > 0) {
    studentWhere.departmentId = by_student_department_id

  }
  if (Number(by_student_room_id) > 0) {
    studentWhere.roomId = by_student_room_id
  }

  attendanceWhere = {
    ...attendanceWhere,
    student: studentWhere
  }
  const presentListWhere = { ...attendanceWhere, ...recordFilters };

  //a stable order so pages don't repeat or skip rows; when looking for low face matches, worst first
  const presentListOrderBy = hasFaceFilter && face_matching_operator.startsWith("l")
    ? [{ faceMatchingPercentage: "asc" }, { reportedTime: "desc" }, { id: "desc" }]
    : [{ reportedTime: "desc" }, { id: "desc" }];

  //get prisma pagination to query in database
  const prismaPagination = toPrismaPagination(page, pageSize);

  //records based on present or absent
  let records;
  let totalCount;
  let percentage;
  const totalStudentsOfAdminsHostel = await AttendanceRecordRepository.totalCountOfStudentsInOneHostel(accessContext.loggedInAdminHostelId);

  const calculatePercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const totalStudentsOfTheHostel =
    await AttendanceRecordRepository.getTotalOfStudentsOfHostel(
      studentWhere
    );

  const totalStudentsWithAtleastOnePresentDuringDateFilter =
    await AttendanceRecordRepository
      .getTotalOfStudentsWithAtleastOnePresentDuringRange(
        attendanceWhere
      );

  const completelyAbsentStudentsCountDuringDates =
    totalStudentsOfTheHostel -
    totalStudentsWithAtleastOnePresentDuringDateFilter;

  if (status === "absent") {
    const datesList = getDatesListBetween(startDate, endDate);
    const { dbRecords, dbTotalCount } = await AttendanceRecordRepository.getAbsentStudentsRecord(hostelId, datesList, studentWhere, prismaPagination.skip, prismaPagination.take);
    records = dbRecords;
    totalCount = dbTotalCount;
    percentage = calculatePercentage(
      dbTotalCount,
      totalStudentsOfTheHostel
    );
  } else {
    [records, totalCount] = await Promise.all(
      [
        AttendanceRecordRepository.getAttendanceRecordsPresent(presentListWhere, prismaPagination.skip, prismaPagination.take, presentListOrderBy),
        AttendanceRecordRepository.getTotalCountOfAttendanceRecordPresent(presentListWhere)
      ]
    );

    percentage = calculatePercentage(
      totalStudentsWithAtleastOnePresentDuringDateFilter,
      totalStudentsOfTheHostel
    );
  }

  // get Summary 
  // const totalStudentsOfTheHostel = await AttendanceRecordRepository.getTotalOfStudentsOfHostel(studentWhere);
  // const totalStudentsWithatleastOnePresentDuringDateFilter = await AttendanceRecordRepository.getTotalOfStudentsWithAtleastOnePresentDuringRange(attendanceWhere);
  // const completelyAbsentStudentsCountDuringDates = totalStudentsOfTheHostel - totalStudentsWithatleastOnePresentDuringDateFilter;

  //get pagination meta
  const paginationMeta = buildMeta(page, pageSize, totalCount);

  return {
    records: {
      summary: {
        totalStudentsOfTheHostel,
        totalStudentsWithAtleastOnePresentDuringDateFilter,
        completelyAbsentStudentsCountDuringDates
      },
      attendanceRecords: records,
      percentage
    },
    paginationMeta
  };
};


const AttendanceRecordService = {
  markAttendance,
  getAttendanceRecords
};

export default AttendanceRecordService;