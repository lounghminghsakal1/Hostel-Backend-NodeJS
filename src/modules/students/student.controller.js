import Responses from "../../utils/responses.utils.js";
import StudentService from "./student.service.js";
import { getAccessContext } from "../../utils/helper-functions.utils.js";

const createStudent = async (req, res, next) => {
  const accessContext = getAccessContext(req);
  const { createdStudentProfile, activationEmailSent, activationEmailError } = await StudentService.createStudent(req.body, accessContext);
  const message = activationEmailSent
    ? "Student created successfully"
    : `Student created, but the activation email couldn't be sent: ${activationEmailError}. Use "Resend activation link" once it's fixed.`;
  return Responses.successResponse(res, message, { ...createdStudentProfile, activationEmailSent, activationEmailError }, 201);
};

const getAllStudentProfiles = async (req, res) => {
  const accessContext = getAccessContext(req);
  const {students, paginationMeta} = await StudentService.getAllStudentProfiles(accessContext, req.validatedQuery);
  return Responses.paginatedResponse(res, "All student profiles fetched successfully", students, paginationMeta);
};

const getOneStudentProfile = async (req, res) => {
  const accessContext = getAccessContext(req);
  const oneStudentProfile = await StudentService.getOneStudentProfileById(Number(req.params.id), req.user, accessContext);
  return Responses.successResponse(res, "Student fetched successfully", oneStudentProfile);
};

const updateStudentProfile = async (req, res) => {
  const accessContext = getAccessContext(req);
  const updatedStudentProfile = await StudentService.updateStudentProfile(Number(req.params.id), req.body, accessContext);
  return Responses.successResponse(res, "Student updated successfully", updatedStudentProfile);
};

const updateStatusOfStudent = async (req, res) => {
  const accessContext = getAccessContext(req);
  const updatedStudent = await StudentService.updateStatusOfStudent(Number(req.params.id), req.body.status, accessContext);
  return Responses.successResponse(res, "Student's status updated successfully", updatedStudent);
};

const changeOrAssignStudentRoom = async (req, res) => {
  const accessContext = getAccessContext(req);
  const StudentProfile = await StudentService.changeOrAssignStudentRoom(Number(req.params.id), req.body.roomId, accessContext);
  return Responses.successResponse(res, "Student room changed or assigned successfully", StudentProfile);
};

const getStudentSplashScreenData = async (req, res) => {
  const accessContext = getAccessContext(req);
  const splashScreenData = await StudentService.getStudentSplashScreenData(accessContext);
  return Responses.successResponse(res, "Student home screen data fetched successfully", {...splashScreenData, user: req.user});
}; 

const setupNewPassword = async (req, res) => {
  const accessContext = getAccessContext(req);
  const setupNewPasswordResponse = await StudentService.setupNewPassword(accessContext, req.body);
  return Responses.successResponse(res, "New password set successfully", setupNewPasswordResponse, 201);
};

const getAllDepartments = async (req, res) => {
  const accessContext = getAccessContext(req);
  const allDepartments = await StudentService.getAllDepartments(accessContext);
  return Responses.successResponse(res, "Departments fetched successfully", allDepartments);
};

const sendActivationLinkMail = async (req, res) => {
  const accessContext = getAccessContext(req);
  const studentProfileId = Number(req.query.studentProfileId);
  const activationMailSentResponse = await StudentService.sendActivationLinkMail(accessContext, studentProfileId);
  return Responses.successResponse(res, "Account activation mail sent successfully", activationMailSentResponse);
};

const forgotPasswordRequest = async (req, res) => {
  const forgotPasswordResponse = await StudentService.forgotPasswordRequest(req.body);
  return Responses.successResponse(res, "New password setup link has been sent to your email", forgotPasswordResponse);
};

const checkStudentImage = async (req, res) => {
  const result = await StudentService.checkStudentImage(req.body.studentImageKey);
  return Responses.successResponse(res, result.message, result);
};

const StudentController = {
  checkStudentImage,
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfile,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom,
  getStudentSplashScreenData,
  setupNewPassword,
  getAllDepartments,
  sendActivationLinkMail,
  forgotPasswordRequest,
};

// const getAccessContext = (req) => {
//   return {
//     loggedInAdminHostelId: req.user.hostelAdminProfile.hostelId,
//     loggedInAdminCollegeId: req.user.collegeId
//   };
// };

export default StudentController;