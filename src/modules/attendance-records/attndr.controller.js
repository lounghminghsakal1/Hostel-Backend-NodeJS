import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import AttendanceRecordService from "./attndr.service.js";

const markAttendance = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdAttendanceRecord = await AttendanceRecordService.markAttendance(accessContext, req.body);
  return Responses.successResponse(res, "Attendance marked as present successfully", createdAttendanceRecord, 201);
};

const getAttendanceRecords = async (req, res) => {
  const accessContext = getAccessContext(req);
  const { attendanceRecords, paginationMeta } = await AttendanceRecordService.getAttendanceRecords(accessContext, req.validatedQuery);
  return Responses.paginatedResponse(res, "Attendance records fetched successfully", attendanceRecords, paginationMeta);
};

const AttendanceRecordController = {
  markAttendance,
  getAttendanceRecords
};

export default AttendanceRecordController;