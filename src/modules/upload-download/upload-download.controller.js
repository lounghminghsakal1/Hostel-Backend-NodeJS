import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import UploadDownloadService from "./upload-download.service.js";

const uploadAttendanceImage = async (req, res) => {
  const uploadedAttendanceImageUrl = await UploadDownloadService.uploadAttendanceImage(req.file);
  return Responses.successResponse(res, "Attendance image uploaded successfully", uploadedAttendanceImageUrl, 201);
};

const uploadStudentProfileImage = async (req, res) => {
  const uploadedStudentProfileImageURL = await UploadDownloadService.uploadStudentProfileImage(req.file);
  return Responses.successResponse(res, "Student profile image updated successfully", uploadedStudentProfileImageURL, 201);
};

const getPresignedUrlForUploadingAttendanceImage = async (req, res) => {
  const presignedUploadUrlFromAWSS3 = await UploadDownloadService.getPresignedUrlForUploadingAttendanceImage();
  return Responses.successResponse(res, "Pre signed upload url (use PUT http method) generated successfully", presignedUploadUrlFromAWSS3, 201);
};

const getPresignedUrlForDownloadingStudentImage = async (req, res) => {
  const accessContext = getAccessContext(req);
  const presignedDownloadUrlFromAWSS3 = await UploadDownloadService.getPresignedUrlForDownloadingStudentImage(accessContext);
  return Responses.successResponse(res, "Pre signed download url (use GET http method) generated successfully", presignedDownloadUrlFromAWSS3, 201);
};

const getPresignedUrlForStudentImageUpload = async (req, res) => {
  const presignedUploadUrlForStudentImageUpload = await UploadDownloadService.getPresignedUrlForStudentImageUpload(req.body);
  return Responses.successResponse(res, "Pre signed upload url (use PUT http method) generated successfully", presignedUploadUrlForStudentImageUpload, 201);
};

const getPresignedDownloadUrlForAttendanceImage = async (req, res) => {
  const imageKey = req.query.imageKey;
  const presignedDownloadUrlForAttendanceImage = await UploadDownloadService.getPresignedDownloadUrlForAttendanceImage(imageKey);
  return Responses.successResponse(res, "Presigned download url for attendance image generated successfully", presignedDownloadUrlForAttendanceImage);
};

const getPreSignedUploadUrl = async (req, res) => {
  const imageFor = req.query.media_for;
  console.log(req.query);
  const preSignedUploadUrl = await UploadDownloadService.getPresignedUploadUrl(imageFor);
  return Responses.successResponse(res, "Presigned upload url generated successfully", preSignedUploadUrl);
};

const UploadDownloadController = {
  uploadAttendanceImage,
  uploadStudentProfileImage,
  getPresignedUrlForUploadingAttendanceImage,
  getPresignedUrlForDownloadingStudentImage,
  getPresignedUrlForStudentImageUpload,
  getPresignedDownloadUrlForAttendanceImage,
  getPreSignedUploadUrl
};

export default UploadDownloadController;