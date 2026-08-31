import Responses from "../../utils/responses.utils.js";
import UploadService from "./upload.service.js";

const uploadAttendanceImage = async (req, res) => {
  const uploadedAttendanceImageUrl = await UploadService.uploadAttendanceImage(req.file);
  return Responses.successResponse(res, "Attendance image uploaded successfully", uploadedAttendanceImageUrl, 201);
};

const uploadStudentProfileImage = async (req, res) => {
  const uploadedStudentProfileImageURL = await UploadService.uploadStudentProfileImage(req.file);
  return Responses.successResponse(res, "Student profile image updated successfully", uploadedStudentProfileImageURL, 201);
};

const UploadController = {
  uploadAttendanceImage,
  uploadStudentProfileImage
};

export default UploadController;