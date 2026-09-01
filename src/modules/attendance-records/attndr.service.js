import createHttpError from "http-errors";
import AttendanceRecordRepository from "./attndr.repository.js";

const markAttendance = async (accessContext, markAttendanceRequestBody) => {
  const {
    capturedImageUrl,
    latitude,
    longitude,
  } = markAttendanceRequestBody;  
  // check configured attendance time is past or not 
  // that is students can mark attendance only after night 8:30 pm and this time can be configured by hostel admin
  const hostel = await AttendanceRecordRepository.findHostelById(accessContext.loggedInStudentHostelId);
  if(!hostel) throw createHttpError(404, `Hostel with hostel id ${accessContext.loggedInStudentHostelId} not found`, {errors: "Invalid request"});

  //"en-GB" is for formatting , here en-GB is refering british format because they represent time in 24 hour format and dd/mm/yyyy format
  const currentTime = new Intl.DateTimeFormat("en-GB",{
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date());

  const currentDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());


  if(currentTime < hostel.attendanceMarkingStartTime) throw createHttpError(422, `Attendance marking time hasn't come yet, wait until ${hostel.attendanceMarkingStartTime}`, {errors: "Invalid request (start time haven't arrived yet)"});
  if(currentTime > hostel.attendanceMarkingEndTime) throw createHttpError(422, `Attendance marking end time (${hostel.attendanceMarkingEndTime}) has already passed`, {errors: "Invalid request (end time passed)"});

  let isLocatedWithinHostelRadius;
  //latitude and longitude processing
  const locationDeviationFromHostel = calculateLocationFromHostel(latitude, longitude, hostel);
  if(locationDeviationFromHostel > hostel.attendanceRadius) {
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
  const deltaLat = toRadians(hostelLatitude -  capturedLatitude);
  const deltaLong = toRadians(hostelLongitude - capturedLongitude);

  // FORMULA -> distance between 2 coordinates , we can't use distance btw 2 points because earth is not flat
  // Haversine formula -> Distance = 2 * R * arcsin(Math.sqrt(sin^2(deltaLat/2) + cos(lat1) cos(lat2) sin^2(deltaLong/2)))
  // here R is the radius of earth

  const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(capturedLatitude) *
              Math.cos(latitude) *
              Math.sin(deltaLong / 2) ** 2 ;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return EARTH_RADIUS_IN_METERES * c;
};

const AttendanceService = {
  markAttendance,

};

export default AttendanceService;