import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import AttendanceService from "./attndr.service.js";

const markAttendance = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdAttendanceRecord = await AttendanceService.markAttendance(accessContext, req.body);
  return Responses.successResponse(res, "Attendance marked as present successfully", createdAttendanceRecord, 201);
};

const AttendanceRecordController = {
  markAttendance,
};

export default AttendanceRecordController;