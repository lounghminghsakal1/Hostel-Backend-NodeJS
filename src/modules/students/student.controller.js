import Responses from "../../utils/responses.utils.js";
import StudentService from "./student.service.js";

const createStudent = async (req, res, next) => {
  const { createdStudentProfile }= await StudentService.createStudent(req.body, req.user.hostelAdminProfile.hostelId);
  return Responses.successResponse(res, "Student created successfully", createdStudentProfile, 201);
};

const getAllStudentProfiles = async (req, res) => {
  const allStudentProfiles = await StudentService.getAllStudentProfiles();
  return Responses.successResponse(res, "All student profiles fetched successfully", allStudentProfiles);
};

const getOneStudentProfile = async (req, res) => {
  const oneStudentProfile = await StudentService.getOneStudentProfileById(Number(req.params.id));
  return Responses.successResponse(res, "Student fetched successfully", oneStudentProfile);
};

const updateStudentProfile = async (req, res) => {
  const updatedStudentProfile = await StudentService.updateStudentProfile(Number(req.params.id), req.body, req.user.hostelAdminProfile.hostelId);
  return Responses.successResponse(res, "Student updated successfully", updatedStudentProfile);
};

const updateStatusOfStudent = async (req, res) => {
  const updatedStudent = await StudentService.updateStatusOfStudent(Number(req.params.id), req.body.status);
  return Responses.successResponse(res, "Student's status updated successfully", updatedStudent);
};

const changeOrAssignStudentRoom = async (req, res) => {
  const StudentProfile = await StudentService.changeOrAssignStudentRoom(req.user.hostelAdminProfile.hostelId, Number(req.params.id), req.body.roomId);
  return Responses.successResponse(res, "Student room changed or assigned successfully", StudentProfile);
};

const StudentController = {
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfile,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom
};

export default StudentController;