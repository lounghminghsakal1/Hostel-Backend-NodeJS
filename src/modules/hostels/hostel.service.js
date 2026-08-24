import createHttpError from "http-errors";
import HostelRepository from "./hostel.repository.js";

const updateHostel = async (hostelId, updateHostelRequestBody, LoggedInAdminHostelId) => {
  //check hostel is there or not
  const hostel = await HostelRepository.findHostelById(hostelId);
  if (!hostel) throw createHttpError(404, `Hostel not found with id ${hostelId}`, { errors: "Invalid hostel id" });

  //logged in admin's hostel id should match with passed hostel id, then only we can assure that user(hostel admin) is updating their hostel only
  if (LoggedInAdminHostelId !== hostelId) throw createHttpError(409, "You cannot update another hostel", { errors: "Invalid hostel id" });

  const {
    hostelName,
    location,
    latitude,
    longitude,
    contactPersonName,
    contactNumber
  } = updateHostelRequestBody;


  //check hostel name is unique within that college
  if (hostelName) {
    const existingHostelWithPassedName = await HostelRepository.findHostelByHostelNameAndCollegeId(hostelName, hostel.collegeId);
    if (existingHostelWithPassedName) throw createHttpError(409, "Hostel with passed name is already exists in your college", { errors: "Invalid hostel name, its not unique" });
  }

  if ((latitude && !longitude) || (!latitude && longitude)) throw createHttpError(409, "Both latitude and longitude must be present", {errors: "Both(latitude and longitude) required"});

  
  const updatedHostel = await HostelRepository.updateHostel(hostelId, hostelName, location, latitude, longitude, contactPersonName, contactNumber);
  return updatedHostel;
};

const getAllHostelsOfLoggedAdminCollege = async (collegeId) => {
  return await HostelRepository.getAllHostelsOfTheCollege(collegeId);
};

const getOneHostel = async (hosteId) => {
  return await HostelRepository.findHostelById(hosteId);
};

const HostelService = {
  updateHostel,
  getAllHostelsOfLoggedAdminCollege,
  getOneHostel
};

export default HostelService;