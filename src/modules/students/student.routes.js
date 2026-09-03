import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import StudentController from "./student.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { changeOrAssignStudentRoomRequestBodySchema, createStudentProfileRequestBodySchema, updateStudentProfileRequestBodySchema, updateStudentStatusRequestBodySchema } from "./student.request-schema.js";

const studentRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

studentRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createStudentProfileRequestBodySchema}), StudentController.createStudent);

studentRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getAllStudentProfiles);

studentRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getOneStudentProfile);

studentRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateStudentProfileRequestBodySchema}) ,StudentController.updateStudentProfile);

studentRouter.patch("/:id/status", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateStudentStatusRequestBodySchema}), StudentController.updateStatusOfStudent);


studentRouter.patch("/:id/room", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: changeOrAssignStudentRoomRequestBodySchema}), StudentController.changeOrAssignStudentRoom);




export default studentRouter;