import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import HostelService from "./hostel.service.js";

const updateHostel = async (req, res) => {
  const accessContext = getAccessContext(req);
  const updatedHostel = await HostelService.updateHostel(Number(req.params.id), req.body, accessContext);
  return Responses.successResponse(res, "Hostel updated successfully", updatedHostel);
};

const getAllHostelsOfLoggedAdminCollege = async (req, res) => {
  const allHostels = await HostelService.getAllHostelsOfLoggedAdminCollege(Number(req.user.collegeId));
  return Responses.successResponse(res, "All hostels of your college fetched successfully", allHostels);
};

const getOneHostel = async (req, res) => {
  const hostel = await HostelService.getOneHostel(Number(req.params.id), req.user.hostelAdminProfile.hostelId);
  return Responses.successResponse(res, "Hoste fetched successfully", hostel);
};

const HostelController = {
  updateHostel,
  getAllHostelsOfLoggedAdminCollege,
  getOneHostel
};

export default HostelController;