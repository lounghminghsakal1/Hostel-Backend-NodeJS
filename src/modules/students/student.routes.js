import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import StudentController from "./student.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { changeOrAssignStudentRoomRequestSchema, createStudentProfileRequestSchema, updateStudentProfileRequestSchema, updateStudentStatusRequestSchema } from "./student.request-schema.js";

const studentRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

studentRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(createStudentProfileRequestSchema), StudentController.createStudent);

studentRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getAllStudentProfiles);

studentRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getOneStudentProfile);

studentRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(updateStudentProfileRequestSchema) ,StudentController.updateStudentProfile);

studentRouter.patch("/:id/status", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(updateStudentStatusRequestSchema), StudentController.updateStatusOfStudent);


studentRouter.patch("/:id/room", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(changeOrAssignStudentRoomRequestSchema), StudentController.changeOrAssignStudentRoom);

export default studentRouter;