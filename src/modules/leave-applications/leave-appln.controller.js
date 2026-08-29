import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import LeaveApplicationService from "./leave-appln.service.js";

const createLeaveApplication = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdLeaveApplication = LeaveApplicationService.createLeaveApplication(accessContext, req.body);
  return Responses.successResponse(res, "Leave application created successfully", createdLeaveApplication, 201);
};

const LeaveApplicationController = {
  createLeaveApplication
};

export default LeaveApplicationController;