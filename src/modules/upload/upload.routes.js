import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import createFileUploader from "../../configs/multer.js";
import UploadController from "./upload.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import z from "zod";

const uploadRouter = express.Router();

const studentRole = "STUDENT";

const hostelAdminRole = "HOSTEL_ADMIN";

const getAttendanceImageDownloadUrlRequestQuerySchema = z.object({
  imageKey: z.string()
});

const attendanceImageUploader = createFileUploader("attendance-images");

const studentProfileImageUploader = createFileUploader("student-profile-images");

uploadRouter.post("/attendance_image", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), attendanceImageUploader.single("captured_image"), UploadController.uploadAttendanceImage);

uploadRouter.post("/student_image", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), studentProfileImageUploader.single("profile_image"), UploadController.uploadStudentProfileImage);

uploadRouter.get("/attendance_image/upload_url", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), UploadController.getPresignedUrlForUploadingAttendanceImage);

uploadRouter.get("/student_image/upload_url", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), UploadController.getPresignedUrlForStudentImageUpload);

uploadRouter.get("/student_image/download_url", authenticateUserMiddleware, UploadController.getPresignedUrlForDownloadingStudentImage);

uploadRouter.get("/attendance_image/download_url", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({query: getAttendanceImageDownloadUrlRequestQuerySchema}), UploadController.getPresignedDownloadUrlForAttendanceImage);



export default uploadRouter;