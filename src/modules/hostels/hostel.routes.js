import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { updateHostelRequestSchema } from "./hostel.request-schema.js";
import HostelController from "./hostel.controller.js";

const hostelRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

hostelRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(updateHostelRequestSchema), HostelController.updateHostel);

//Here actually the super admin can access this but anyway for now its hostel admin
hostelRouter.get("", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), HostelController.getAllHostelsOfLoggedAdminCollege);

hostelRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), HostelController.getOneHostel);

export default hostelRouter;