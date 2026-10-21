import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import StudentController from "./student.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { changeOrAssignStudentRoomRequestBodySchema, createStudentProfileRequestBodySchema, forgotPasswordRequestBodySchema, sendActivationLinkMailRequestQuerySchema, setupNewPasswordSchema, updateStudentProfileRequestBodySchema, updateStudentStatusRequestBodySchema } from "./student.request-schema.js";

const studentRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

const studentRole = "STUDENT";

studentRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createStudentProfileRequestBodySchema}), StudentController.createStudent);

studentRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getAllStudentProfiles);

// IMPORTANT: specific/static routes first, if not then /home matches other route by mistake like /:id can be matched so put static routes first (i am debugging this for 30mins and finally found and learnt a new thing now)
//student flow home screen data
studentRouter.get("/home", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), StudentController.getStudentHomeScreenData);

studentRouter.get("/departments", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getAllDepartments);

studentRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), StudentController.getOneStudentProfile);

studentRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateStudentProfileRequestBodySchema}) ,StudentController.updateStudentProfile);

studentRouter.patch("/:id/status", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateStudentStatusRequestBodySchema}), StudentController.updateStatusOfStudent);


studentRouter.patch("/:id/room", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: changeOrAssignStudentRoomRequestBodySchema}), StudentController.changeOrAssignStudentRoom);

studentRouter.post("/setup_new_password", validateRequestMiddleware({body: setupNewPasswordSchema}), StudentController.setupNewPassword);

//activation link automatically will be sent when student profile is created but that link will be expired in 5 mins so if want that activation mail link to be sent again then use this api
studentRouter.post("/activation_link", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({query: sendActivationLinkMailRequestQuerySchema}), StudentController.sendActivationLinkMail);

//set up new password link will be sent to student's email
studentRouter.post("/forgot_password", validateRequestMiddleware({body: forgotPasswordRequestBodySchema}), StudentController.forgotPasswordRequest);

export default studentRouter;