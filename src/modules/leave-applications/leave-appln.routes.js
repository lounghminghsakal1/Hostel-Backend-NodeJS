import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createLeaveApplicationRequestBodySchema, reviewLeaveApplicationRequestBodySchema, updateLeaveApplicationRequestBodySchema } from "./leave-appln.request-schema.js";
import LeaveApplicationController from "./leave-appln.controller.js";

const leaveApplicationRouter = express.Router();

const studentRole = "STUDENT";
const hostelAdminRole = "HOSTEL_ADMIN";

leaveApplicationRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware({body: createLeaveApplicationRequestBodySchema}), LeaveApplicationController.createLeaveApplication);

leaveApplicationRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware({body: updateLeaveApplicationRequestBodySchema}), LeaveApplicationController.updateLeaveApplication);

leaveApplicationRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), LeaveApplicationController.getAllLeaveApplications);

leaveApplicationRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), LeaveApplicationController.getOneLeaveApplication);

leaveApplicationRouter.patch("/:id/review", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: reviewLeaveApplicationRequestBodySchema}), LeaveApplicationController.reviewLeaveApplication);

leaveApplicationRouter.patch("/:id/cancel", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), LeaveApplicationController.cancelLeaveApplication);

export default leaveApplicationRouter;

