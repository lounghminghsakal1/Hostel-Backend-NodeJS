import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import HostelAdminController from "./hostel-admins.controller.js";

const hostelAdminRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

hostelAdminRouter.get("/splash_screen", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), HostelAdminController.getHostelAdminSplashScreenData);

export default hostelAdminRouter;