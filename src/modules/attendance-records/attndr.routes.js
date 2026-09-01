import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createAttendanceRecord } from "./attndr.request-schema.js";
import AttendanceRecordController from "./attndr.controller.js";

const attendanceRecordsRouter = express.Router();

const studentRole = "STUDENT";

attendanceRecordsRouter.post("", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware(createAttendanceRecord), AttendanceRecordController.markAttendance);

export default attendanceRecordsRouter;