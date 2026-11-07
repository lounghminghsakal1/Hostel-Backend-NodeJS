import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import WebsiteController from "./website.controller.js";
import { attendanceHistoryQuerySchema, dashboardQuerySchema, exportStudentsQuerySchema } from "./website.request-schema.js";

//website-only endpoints, mounted at /website before the shared endpoints (see app.js)
//they give the website's wide screens their extra data in one request each
const websiteRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";
const studentRole = "STUDENT";

websiteRouter.get("/dashboard", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({ query: dashboardQuerySchema }), WebsiteController.getDashboard);

websiteRouter.get("/nav-counts", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), WebsiteController.getNavCounts);

websiteRouter.get("/rooms/summary", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), WebsiteController.getRoomsSummary);

websiteRouter.get("/notices/summary", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), WebsiteController.getNoticesSummary);

//these two must stay above the shared GET /students/:id (they're mounted first, so they are)
websiteRouter.get("/students/export", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({ query: exportStudentsQuerySchema }), WebsiteController.exportStudents);

websiteRouter.get("/students/me/summary", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), WebsiteController.getMyStudentSummary);

websiteRouter.get("/students/:id/attendance-history", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({ query: attendanceHistoryQuerySchema }), WebsiteController.getStudentAttendanceHistory);

export default websiteRouter;
