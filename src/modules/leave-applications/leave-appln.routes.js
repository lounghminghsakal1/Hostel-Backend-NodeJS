import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createLeaveApplicationRequestSchema, reviewLeaveApplicationRequestSchema, updateLeaveApplicationRequestSchema } from "./leave-appln.request-schema.js";
import LeaveApplicationController from "./leave-appln.controller.js";

const leaveApplicationRouter = express.Router();

const studentRole = "STUDENT";
const hostelAdminRole = "HOSTEL_ADMIN";

leaveApplicationRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware(createLeaveApplicationRequestSchema), LeaveApplicationController.createLeaveApplication);

leaveApplicationRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware(updateLeaveApplicationRequestSchema), LeaveApplicationController.updateLeaveApplication);

leaveApplicationRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), LeaveApplicationController.getAllLeaveApplications);

leaveApplicationRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), LeaveApplicationController.getOneLeaveApplication);

leaveApplicationRouter.patch("/:id/review", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(reviewLeaveApplicationRequestSchema), LeaveApplicationController.reviewLeaveApplication);

leaveApplicationRouter.patch("/:id/cancel", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), LeaveApplicationController.cancelLeaveApplication);

export default leaveApplicationRouter;

