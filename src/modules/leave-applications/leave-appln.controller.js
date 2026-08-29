import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import LeaveApplicationService from "./leave-appln.service.js";

const createLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdLeaveApplication = await LeaveApplicationService.createLeaveApplication(accessContext, req.body);
  return Responses.successResponse(res, "Leave application created successfully", createdLeaveApplication, 201);
};

const updateLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);
  const updatedLeaveApplication = await LeaveApplicationService.updateLeaveApplication(accessContext, Number(req.params.id), req.body);
  return Responses.successResponse(res, "Leave application updated successfully", updatedLeaveApplication);
};

const getAllLeaveApplications= async (req, res) => {
  const accessContext = getAccessContext(req);
  const allLeaveApplications = await LeaveApplicationService.getAllLeaveApplications(accessContext);
  return Responses.successResponse(res, "All leave applications fetched successfully", allLeaveApplications);
};

const getOneLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);

  const leaveApplication = await LeaveApplicationService.getOneLeaveApplication(accessContext, Number(req.params.id));
  return Responses.successResponse(res, "Leave application fetched successfully", leaveApplication);
};

const reviewLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);
  const reviewedLeaveApplication = await LeaveApplicationService.reviewLeaveApplication(accessContext, Number(req.params.id), req.body);
  return Responses.successResponse(res, "Leave application reviewed successfully", reviewedLeaveApplication);
};

const cancelLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);
  const cancelledLeaveApplication = await LeaveApplicationService.cancelLeaveApplication(accessContext, Number(req.params.id));
  return Responses.successResponse(res, "Leave application cancelled successfully", cancelledLeaveApplication);
};

const LeaveApplicationController = {
  createLeaveApplication,
  updateLeaveApplication,
  getAllLeaveApplications,
  getOneLeaveApplication,
  reviewLeaveApplication,
  cancelLeaveApplication
};

export default LeaveApplicationController;