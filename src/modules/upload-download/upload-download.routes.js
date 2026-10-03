import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import createFileUploader from "../../configs/multer.js";
import UploadDownloadController from "./upload-download.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import z from "zod";

const UploadDownloadRouter = express.Router();

const studentRole = "STUDENT";

const hostelAdminRole = "HOSTEL_ADMIN";

const getAttendanceImageDownloadUrlRequestQuerySchema = z.object({
  imageKey: z.string()
});

const getUploadUrlRequestQuerySchema = z.object({
  media_for: z.string()
});

const attendanceImageUploader = createFileUploader("attendance-images");

const studentProfileImageUploader = createFileUploader("student-profile-images");

UploadDownloadRouter.post("/attendance_image", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), attendanceImageUploader.single("captured_image"), UploadDownloadController.uploadAttendanceImage);

UploadDownloadRouter.post("/student_image", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), studentProfileImageUploader.single("profile_image"), UploadDownloadController.uploadStudentProfileImage);

UploadDownloadRouter.get("/attendance_image/upload_url", authenticateUserMiddleware, authorizeUserMiddleware(studentRole), UploadDownloadController.getPresignedUrlForUploadingAttendanceImage);

UploadDownloadRouter.get("/student_image/upload_url", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), UploadDownloadController.getPresignedUrlForStudentImageUpload);

UploadDownloadRouter.get("/student_image/download_url", authenticateUserMiddleware, UploadDownloadController.getPresignedUrlForDownloadingStudentImage);

UploadDownloadRouter.get("/attendance_image/download_url", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({query: getAttendanceImageDownloadUrlRequestQuerySchema}), UploadDownloadController.getPresignedDownloadUrlForAttendanceImage);

UploadDownloadRouter.get("/upload_url", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({query: getUploadUrlRequestQuerySchema}), UploadDownloadController.getPreSignedUploadUrl);

export default UploadDownloadRouter;