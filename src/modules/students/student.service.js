import createHttpError from "http-errors";
import { prisma } from "../../configs/db.js";
import StudentRepository from "./student.repository.js";
import bcrypt from "bcrypt";

const createStudent = async (studentRequestBody, accessContext) => {
  const {
    email,
    studentName,
    contactNumber,
    parentMobileNumber,
    departmentId,
    roomId
  } = studentRequestBody;


  return await prisma.$transaction(async (tx) => {

    //check email is already registered or not
    const existingUser = await StudentRepository.findUserByEmail(tx, email);
    if (existingUser) throw createHttpError(409, "Email already exists", { errors: "Existing email - Email already exists" });

    //check contact number is already registered or not - contact number is available on student profile
    const registeredUser = await StudentRepository.findStudentProfileByContactNumber(tx, contactNumber);
    if (registeredUser) throw createHttpError(409, "Contact number already exists", { errors: "Existing contact number - Contact number already exists" });

    //check department id is valid or not - that departmentId should be present at that college level (within that college scope), since hostel admin is creating student profile we can get collegeId from loggedIn admin's auth details (accessContext)
    const department = await StudentRepository.findDepartmentById(tx, departmentId, accessContext.loggedInAdminCollegeId);
    if (!department) throw createHttpError(404, "Department not found", { errors: "Invalid department id" });

    //get college using hostel id (hostel id got from admin logged in jwt token) - this college id and department.collegeId should match
    const hostel = await StudentRepository.findHostelById(tx, accessContext.loggedInAdminHostelId);
    if (!hostel) throw createHttpError(404, "Hostel not found", { errors: "Invalid hostel id" });
    console.log(".djfnsj",hostel)
    console.log("jssfgs r", department)
    console.log("jfvgfsr", accessContext);
    if ((Number(hostel.collegeId) !== Number(department.collegeId)) || (Number(department.collegeId) !== Number(accessContext.loggedInAdminCollegeId))) throw createHttpError(409, "Invalid department or you cannot create student for this department", { errors: "Invalid request" });

    if (roomId) {
      //check room id is valid or not - room id should be find within that hostel scope so 
      const room = await StudentRepository.findRoomById(tx, roomId, accessContext.loggedInAdminHostelId);
      if (!room) throw createHttpError(404, "Room not found", { errors: "Invalid room id" });

      //room.hostelId and hostelId of logged in admin should match that is -> logged admin can create student for his hostel only
      if (room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, "Room does not belongs to your hostel", { errors: "Room doesn't belongs to logged admin's hostel" });

      if (room.capacity === room._count.studentProfiles) throw createHttpError(409, "Room is already full", { errors: `Room full capacity${room.capacity} is attained already` });
    }

    const STUDENT_ROLE = "STUDENT";
    //GET student role (role.id) to send to user creation (roleId)
    const studentRole = await StudentRepository.findRoleByRoleName(tx, STUDENT_ROLE);
    if (!studentRole) throw createHttpError(404, "Student role not found, so create a student role first", { errors: "Student role not found" });

    //temp password hash to set it in db
    const tempPassword = await bcrypt.hash("Sakal@123", 12);

    //ALL validations are finished and passed so now create user
    const createdUser = await StudentRepository.createUser(tx, email, tempPassword, studentRole.id, accessContext.loggedInAdminCollegeId);

    //user created now studentprofile has to be created
    const createdStudentProfile = await StudentRepository.createStudentProfile(tx, studentName, contactNumber, parentMobileNumber, createdUser.id, departmentId, roomId, accessContext.loggedInAdminCollegeId, accessContext.loggedInAdminHostelId);

    return {
      createdUser,
      createdStudentProfile
    };
  });
};


const getAllStudentProfiles = async (accessContext) => {
  return await StudentRepository.getAllStudentProfiles(accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
};

const getOneStudentProfileById = async (id, accessContext) => {
  const oneStudent = await StudentRepository.getOneStudentProfileById(id, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (oneStudent === null) throw createHttpError(404, `Student with id ${id} is not found`, { errors: "Student id not found in the database" });
  return oneStudent;
};

const updateStudentProfile = async (id, updateStudentProfileRequestBody, accessContext) => {
  const {
    email,
    studentName,
    contactNumber,
    parentMobileNumber,
    departmentId,
    roomId
  } = updateStudentProfileRequestBody;

  //check studentprofile with that id is present in db or not , then only we can update it - college and hostel scoped
  const studentProfile = await StudentRepository.findStudentProfileById(id, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!studentProfile) throw createHttpError(404, `Student profile with id ${id} not found`, { errors: "Invalid id" });

  //check whether this student's status is active or not -> if active then only can update else not - college and hostel scope may need or may not 
  const user = await StudentRepository.findUserById(studentProfile.userId);
  if(user.status !== "ACTIVE") throw createHttpError(409, `Student profile is not active, currently its ${user.status}, so if want then change the status of the student profile and update`, {errors: "Student profile is not active"});

  return await prisma.$transaction(async (tx) => {

    if (email) {
      //check passed email is unique or not 
      const existingUserOfThisEmail = await StudentRepository.findUserByEmail(tx, email);
      if (existingUserOfThisEmail) throw createHttpError(409, "Email already in use", { errors: "Invalid email" });

      //here, email validation passed so now we can update the email and email present in user model so update it 
      const updatedUser = await StudentRepository.updateEmailOfUser(tx, studentProfile.userId, email);
    }

    if (contactNumber) {
      //contact number is unique field so if passed we should check and update it
      const existingStudentProfileWithThisContactNumber = await StudentRepository.findStudentProfileByContactNumber(tx, contactNumber);
      if(existingStudentProfileWithThisContactNumber) throw createHttpError(409, "Student profile with this new contact number is already exists", { errors: "Contact number already exists" });

      //update -> contact number but since all other fields are also in studentprofile entity we can update in 1 query at last after all validations are passed
    }

    if(departmentId) {
      //check department exists or not 
      const department = await StudentRepository.findDepartmentById(tx, departmentId, accessContext.loggedInAdminCollegeId);
      if(!department) throw createHttpError(404, `Department not found`, {errors: "Invalid department id"});

      //check this department's college belongs to logged hostel_admin's hostel's college or not 
      // so for that department.collegeId is need which we already have now we need logged in hostel_admin's collegeId , 
      //so we already have hostelId which is logged in hostel_admin's hostel id so using that we can find that hostel and we can get hostel.collegeId of that
      // const hostelOfLoggedInHostelAdmin = await StudentRepository.findHostelById(tx, accessContext.loggedInAdminHostelId);
      // if(!hostelOfLoggedInHostelAdmin) throw createHttpError(404, "Hostel id is not found", "Invalid hostel id of logged in admin");
      
      if(department.collegeId !== accessContext.loggedInAdminCollegeId) throw createHttpError(409, "Invalid college id passed, you cannot change this student profile to this college id", {errors: "Hostel admin's hostel doesn't belongs to this college id"});
    }

    if(roomId) {
      //check roomId is valid or not 
      const room = await StudentRepository.findRoomById(tx, roomId, accessContext.loggedInAdminHostelId);
      if(!room) throw createHttpError(404, `Room not found with id as ${roomId}`, {errors: "Invalid room id"});

      //check this room.hostelId belongs to logged in hostel admin's hostel id or not
      if(room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, "You cannot assign room which is not belongs to your hostel", {errors: "Invalid room id"});

      if(room.capacity === room._count.studentProfiles) throw createHttpError(409, "Room is already full", {errors: "Invalid room id"});
    }

    //ALL validations are passed so update student profile
    const updatedStudentProfile = await StudentRepository.updateStudentProfile(tx, studentProfile.id, studentName, contactNumber, parentMobileNumber, departmentId, roomId);


    return updatedStudentProfile;
  });
};

const updateStatusOfStudent = async (studentId, status, accessContext) => {
  //check student with id is present or not - college or hostel scoped
  const student = await StudentRepository.findStudentProfileById(studentId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if(!student) throw createHttpError(404, `Student with id ${studentId} not found`, {errors: "Invalid student id"});

  //check the passed status and already student's status is same or not , if same throw error that its already in that staus only
  if(status === student.user.status) throw createHttpError(409, `Student's status is already ${student.user.status}`, {errors: "Invalid status"});

  const updatedUserProfileOfThatStudent = await StudentRepository.updateStatusOfStudent(student.user.id, status); //here scope may need or may not need - here i didn't do because the user id is get from student.user.id and that student is fetched after passing scope so
  return StudentRepository.findStudentProfileById(studentId,accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
};

const changeOrAssignStudentRoom = async (studentId, roomId, accessContext) => {
  //check student with id present or not
  const studentProfile = await StudentRepository.findStudentProfileById(studentId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if(!studentProfile) throw createHttpError(404, `Student with id ${studentId} not found`, {errors: "Invalid student id"});

  //check room with id present or not
  const room = await StudentRepository.findRoomById(prisma, roomId, accessContext.loggedInAdminHostelId);
  if(!room) throw createHttpError(404, `Room not found with id ${roomId}`, {errors: "Invalid room id"});

  //check that the student belongs to logged in admin's hostel or not 
  if(studentProfile.room && studentProfile.room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, "The student doen't belongs to your hostel", {errors: "Invalid student id"});

  //room.hostel id must match with logged admin hostel id
  if(room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, `This room doesn't belongs to your hostel`, {errors: "Invalid room id"});

  //check room has capacity or not 
  if(room._count.studentProfiles === room.capacity) throw createHttpError(409, `Room is alread full (capacity - ${room.capacity})`, {errors: "Room is full"});

  //ok now room has capacity so now can assign (or change) that room to that student
  const roomAssignedOrChangedStudentProfile = await StudentRepository.updateRoomOfThestudent(studentId, roomId); //here also the passed student id is validated that this is college scoped and hostel scoped because at first line of this service function itself student fetched using this studentId is scoped by college as well as hostel
  
  return roomAssignedOrChangedStudentProfile; 

};


const StudentService = {
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfileById,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom
};

export default StudentService;