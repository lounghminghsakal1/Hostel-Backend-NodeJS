import Responses from "../../utils/responses.utils.js";
import HostelService from "./hostel.service.js";

const updateHostel = async (req, res) => {
  const updatedHostel = await HostelService.updateHostel(Number(req.params.id), req.body, req.user.hostelAdminProfile.hostelId);
  return Responses.successResponse(res, "Hostel updated successfully", updatedHostel);
};

const getAllHostelsOfLoggedAdminCollege = async (req, res) => {
  const allHostels = await HostelService.getAllHostelsOfLoggedAdminCollege(Number(req.user.hostelAdminProfile.hostel.collegeId));
  return Responses.successResponse(res, "All hostels of your college fetched successfully", allHostels);
};

const getOneHostel = async (req, res) => {
  const hostel = await HostelService.getOneHostel(Number(req.params.id));
  return Responses.successResponse(res, "Hoste fetched successfully", hostel);
};

const HostelController = {
  updateHostel,
  getAllHostelsOfLoggedAdminCollege,
  getOneHostel
};

export default HostelController;