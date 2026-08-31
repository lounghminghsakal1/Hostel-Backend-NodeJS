import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import createFileUploader from "../../configs/multer.js";
import UploadController from "./upload.controller.js";

const uploadRouter = express.Router();

const studentRole = "STUDENT";

const hostelAdminRole = "HOSTEL_ADMIN";

const attendanceImageUploader = createFileUploader("attendance-images");

const studentProfileImageUploader = createFileUploader("student-profile-images");

uploadRouter.post("/attendance_image", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), attendanceImageUploader.single("captured_image"), UploadController.uploadAttendanceImage);

uploadRouter.post("/student_image", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), studentProfileImageUploader.single("profile_image"), UploadController.uploadStudentProfileImage);

export default uploadRouter;