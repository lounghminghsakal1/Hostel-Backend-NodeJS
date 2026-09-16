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
  console.log("ldfdsdjfnkrjfnsj");
  const accessContext = getAccessContext(req);
  const homeScreenData = await StudentService.getStudentHomeScreenData(accessContext);
  return Responses.successResponse(res, "Student home screen data fetched successfully", homeScreenData);
}; 

const StudentController = {
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfile,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom,
  getStudentHomeScreenData
};

// const getAccessContext = (req) => {
//   return {
//     loggedInAdminHostelId: req.user.hostelAdminProfile.hostelId,
//     loggedInAdminCollegeId: req.user.collegeId
//   };
// };

export default StudentController;