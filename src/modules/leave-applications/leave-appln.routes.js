import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createLeaveApplicationSchema } from "./leave-appln.request-schema.js";
import LeaveApplicationController from "./leave-appln.controller.js";

const leaveApplicationRouter = express.Router();

const studentRole = "STUDENT";

leaveApplicationRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), validateRequestMiddleware(createLeaveApplicationSchema), LeaveApplicationController.createLeaveApplication);


export default leaveApplicationRouter;

