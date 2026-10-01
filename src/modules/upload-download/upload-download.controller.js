import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import UploadService from "./upload-download.service.js";

const uploadAttendanceImage = async (req, res) => {
  const uploadedAttendanceImageUrl = await UploadService.uploadAttendanceImage(req.file);
  return Responses.successResponse(res, "Attendance image uploaded successfully", uploadedAttendanceImageUrl, 201);
};

const uploadStudentProfileImage = async (req, res) => {
  const uploadedStudentProfileImageURL = await UploadService.uploadStudentProfileImage(req.file);
  return Responses.successResponse(res, "Student profile image updated successfully", uploadedStudentProfileImageURL, 201);
};

const getPresignedUrlForUploadingAttendanceImage = async (req, res) => {
  const presignedUploadUrlFromAWSS3 = await UploadService.getPresignedUrlForUploadingAttendanceImage();
  return Responses.successResponse(res, "Pre signed upload url (use PUT http method) generated successfully", presignedUploadUrlFromAWSS3, 201);
};

const getPresignedUrlForDownloadingStudentImage = async (req, res) => {
  const accessContext = getAccessContext(req);
  const presignedDownloadUrlFromAWSS3 = await UploadService.getPresignedUrlForDownloadingStudentImage(accessContext);
  return Responses.successResponse(res, "Pre signed download url (use GET http method) generated successfully", presignedDownloadUrlFromAWSS3, 201);
};

const getPresignedUrlForStudentImageUpload = async (req, res) => {
  const presignedUploadUrlForStudentImageUpload = await UploadService.getPresignedUrlForStudentImageUpload(req.body);
  return Responses.successResponse(res, "Pre signed upload url (use PUT http method) generated successfully", presignedUploadUrlForStudentImageUpload, 201);
};

const getPresignedDownloadUrlForAttendanceImage = async (req, res) => {
  const imageKey = req.query.imageKey;
  const presignedDownloadUrlForAttendanceImage = await UploadService.getPresignedDownloadUrlForAttendanceImage(imageKey);
  return Responses.successResponse(res, "Presigned download url for attendance image generated successfully", presignedDownloadUrlForAttendanceImage);
};

const UploadController = {
  uploadAttendanceImage,
  uploadStudentProfileImage,
  getPresignedUrlForUploadingAttendanceImage,
  getPresignedUrlForDownloadingStudentImage,
  getPresignedUrlForStudentImageUpload,
  getPresignedDownloadUrlForAttendanceImage
};

export default UploadController;