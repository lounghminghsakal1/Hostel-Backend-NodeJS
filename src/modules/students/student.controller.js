import Responses from "../../utils/responses.utils.js";
import StudentService from "./student.service.js";
import { getAccessContext } from "../../utils/helper-functions.utils.js";

const createStudent = async (req, res, next) => {
  const accessContext = getAccessContext(req);
  const { createdStudentProfile }= await StudentService.createStudent(req.body, accessContext);
  return Responses.successResponse(res, "Student created successfully", createdStudentProfile, 201);
};

const getAllStudentProfiles = async (req, res) => {
  const accessContext = getAccessContext(req);
  const allStudentProfiles = await StudentService.getAllStudentProfiles(accessContext);
  return Responses.successResponse(res, "All student profiles fetched successfully", allStudentProfiles);
};

const getOneStudentProfile = async (req, res) => {
  const accessContext = getAccessContext(req);
  const oneStudentProfile = await StudentService.getOneStudentProfileById(Number(req.params.id), accessContext);
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

const getStudentHomeScreenData = async (req, res) => {
  const accessContext = getAccessContext(req);
  const homeScreenData = await StudentService.getStudentHomeScreenData(accessContext);
  return Responses.successResponse(res, "Student home screen data fetched successfully", homeScreenData);
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

const StudentController = {
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfile,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom,
  getStudentHomeScreenData,
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