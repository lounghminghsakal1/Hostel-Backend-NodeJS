import createHttpError from "http-errors";
import HostelRepository from "./hostel.repository.js";
import { isValidTimeString } from "../../utils/helper-functions.utils.js";

const updateHostel = async (hostelId, updateHostelRequestBody, accessContext) => {
  //logged in admin's hostel id should match with passed hostel id, then only we can assure that user(hostel admin) is updating their hostel only
  if (accessContext.loggedInAdminHostelId !== hostelId) throw createHttpError(403, "You cannot update another hostel", { errors: "Invalid hostel id" });

  //check hostel is there or not - within the college scope (college id got from logged in admin)
  const hostel = await HostelRepository.findHostelById(hostelId, accessContext.loggedInAdminCollegeId);
  if (!hostel) throw createHttpError(404, `Hostel not found with id ${hostelId}`, { errors: "Invalid hostel id" });

  const {
    hostelName,
    location,
    latitude,
    longitude,
    contactPersonName,
    contactNumber,
    attendanceMarkingStartTime,
    attendanceMarkingEndTime,
    attendanceRadius
  } = updateHostelRequestBody;


  //check hostel name is unique within that college
  if (hostelName) {
    const existingHostelWithPassedName = await HostelRepository.findHostelByHostelNameAndCollegeId(hostelName, accessContext.loggedInAdminCollegeId, hostelId);
    if (existingHostelWithPassedName) throw createHttpError(409, "Hostel with passed name is already exists in your college", { errors: "Invalid hostel name, its not unique" });
  }

  //0 is falsy but its valid in latitude , longitude values so put a check that latitude is not undefined and not null and same with longitude and check if its both not there (false) then no problem , both is there(true) no proble
  // but one is there(true) and another is not there (false) should not be
  // I checked it now - latitide 0 place is equator and equator pass in indian ocean (near) to india, so no college or hostel would be present at latitude 0 for india
  // same with longitude - longitude lies in green witch so no need to worry for india
  if ((latitude && !longitude) || (!latitude && longitude)) throw createHttpError(409, "Both latitude and longitude must be present", { errors: "Both(latitude and longitude) required" });

  if(attendanceMarkingStartTime && !isValidTimeString(attendanceMarkingStartTime)) {
    throw createHttpError(409, "Invalid start time format in payload", {errors: "Invalid time format"});
  }

  if(attendanceMarkingEndTime && !isValidTimeString(attendanceMarkingEndTime)) {
    throw createHttpError(409,"Invalid end time format in payload", {errors: "Invalid time format"});
  }
  
  if(attendanceRadius && (attendanceRadius <= 10 || attendanceRadius >= 10000)) {
    throw createHttpError(409, "Invalid attendance radius, attendance radius can be between 10m to 10km", {errors: "Invalid attendance radius"});
  }

  const updatedHostel = await HostelRepository.updateHostel(hostelId, hostelName, location, latitude, longitude, contactPersonName, contactNumber, attendanceMarkingStartTime, attendanceMarkingEndTime, attendanceRadius);
  return updatedHostel;
};

const getAllHostelsOfLoggedAdminCollege = async (collegeId) => {
  return await HostelRepository.getAllHostelsOfTheCollege(collegeId);
};

const getOneHostel = async (hosteId, loggedInAdminHostelId) => {
  if (hosteId !== loggedInAdminHostelId) throw createHttpError(401, "You can only access your hostel only", { errors: "Invalid hostel id" });
  return await HostelRepository.findHostelById(hosteId);
};

const HostelService = {
  updateHostel,
  getAllHostelsOfLoggedAdminCollege,
  getOneHostel
};

export default HostelService;