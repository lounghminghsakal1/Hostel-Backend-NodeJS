import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import WebsiteService from "./website.service.js";

const getDashboard = async (req, res) => {
  const data = await WebsiteService.getDashboard(getAccessContext(req), req.validatedQuery);
  return Responses.successResponse(res, "Dashboard fetched successfully", data);
};

const getNavCounts = async (req, res) => {
  const data = await WebsiteService.getNavCounts(getAccessContext(req));
  return Responses.successResponse(res, "Navigation counts fetched successfully", data);
};

const getStudentAttendanceHistory = async (req, res) => {
  const data = await WebsiteService.getStudentAttendanceHistory(getAccessContext(req), Number(req.params.id), req.validatedQuery);
  return Responses.successResponse(res, "Attendance history fetched successfully", data);
};

const getRoomsSummary = async (req, res) => {
  const data = await WebsiteService.getRoomsSummary(getAccessContext(req));
  return Responses.successResponse(res, "Rooms summary fetched successfully", data);
};

const getNoticesSummary = async (req, res) => {
  const data = await WebsiteService.getNoticesSummary(getAccessContext(req));
  return Responses.successResponse(res, "Notices summary fetched successfully", data);
};

const exportStudents = async (req, res) => {
  const data = await WebsiteService.exportStudents(getAccessContext(req), req.validatedQuery);
  return Responses.successResponse(res, "Students fetched successfully", data);
};

const getMyStudentSummary = async (req, res) => {
  const data = await WebsiteService.getMyStudentSummary(getAccessContext(req));
  return Responses.successResponse(res, "Student summary fetched successfully", data);
};

const WebsiteController = {
  getDashboard,
  getNavCounts,
  getStudentAttendanceHistory,
  getRoomsSummary,
  getNoticesSummary,
  exportStudents,
  getMyStudentSummary
};

export default WebsiteController;
