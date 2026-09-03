import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createAttendanceRecordRequestBodySchema } from "./attndr.request-schema.js";
import AttendanceRecordController from "./attndr.controller.js";

const attendanceRecordsRouter = express.Router();

const studentRole = "STUDENT";

const hostelAdminRole = "HOSTEL_ADMIN";

attendanceRecordsRouter.post("", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware({body: createAttendanceRecordRequestBodySchema}), AttendanceRecordController.markAttendance);

attendanceRecordsRouter.get("", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), AttendanceRecordController.getAttendanceRecords);

export default attendanceRecordsRouter;