import createHttpError from "http-errors";
import { prisma } from "../../configs/db.js";
import StudentRepository from "./student.repository.js";
import bcrypt from "bcrypt";
import { getAttendanceWindowState } from "../../utils/dates.utils.js";
import { getS3SignedUrlByKey } from "../../utils/helper-functions.utils.js";
import { generateActivationToken, getHashedVersionOfToken } from "../../utils/activation-token.utils.js";
import sendEmail, { describeEmailError } from "../../services/email.service.js";
import { accountActivationEmail, passwordResetEmail } from "../../services/email-templates.js";
import { ACTIVATION_LINK_TTL_MS, PASSWORD_RESET_LINK_TTL_MS, formatIstDateTime, setupPasswordLink } from "../../utils/app-links.utils.js";
import { getHasedVersionOfPassword } from "../../utils/password.utils.js";
import { buildMeta, toPrismaPagination } from "../../utils/pagination.utils.js";
import { assertStudentPhotoUsable, checkStudentPhoto } from "../../services/face-server.service.js";

const createStudent = async (studentRequestBody, accessContext) => {
  const {
    email,
    studentName,
    contactNumber,
    parentMobileNumber,
    departmentId,
    rollNumber,
    studentImageKey,
    roomId
  } = studentRequestBody;

  //the photo on file is what every check-in is compared with, so it must show one clear, front-facing face
  //(checked before the transaction - it downloads and analyses the photo)
  if (studentImageKey) await assertStudentPhotoUsable(studentImageKey);

  const result = await prisma.$transaction(async (tx) => {

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
    // const tempPassword = await bcrypt.hash("Sakal@123", 12);    --- now changed to link activation approach

    //ALL validations are finished and passed so now create user
    const createdUser = await StudentRepository.createUser(tx, email, studentRole.id, accessContext.loggedInAdminCollegeId);

    //user created now studentprofile has to be created
    const createdStudentProfile = await StudentRepository.createStudentProfile(tx, studentName, contactNumber, parentMobileNumber, createdUser.id, departmentId, rollNumber, roomId, studentImageKey, accessContext.loggedInAdminCollegeId, accessContext.loggedInAdminHostelId);

    //create account setup token record and send email to student containing the activation link (page_route?token=GeneratedToken) 
    const { rawToken, hashedToken } = generateActivationToken();
    const expiresAt = new Date(Date.now() + ACTIVATION_LINK_TTL_MS);

    await StudentRepository.createAccountSetupTokenRecord(tx, createdUser.id, hashedToken, expiresAt, "ACCOUNT_ACTIVATION");

    return {
      createdUser,
      createdStudentProfile,
      rawToken,
      expiresAt,
      hostelName: hostel?.hostelName
    };
  });

  //send email to student containing activation link
  //the student is already created at this point, so a failed email must not turn the response into an error
  //(the admin can use "resend activation link" from the student's page)
  const activationEmail = accountActivationEmail({
    studentName: result.createdStudentProfile.studentName,
    hostelName: result.hostelName,
    link: setupPasswordLink(result.rawToken, "welcome"),
    expiresAt: formatIstDateTime(result.expiresAt),
  });
  let activationEmailSent = true;
  let activationEmailError = null;
  try {
    await sendEmail(result.createdUser.email, activationEmail.subject, activationEmail.text, activationEmail.html);
  } catch (err) {
    activationEmailSent = false;
    activationEmailError = describeEmailError(err);
    console.error("Activation email failed for user " + result.createdUser.id, err);
  }

  return { createdUser: result.createdUser, createdStudentProfile: result.createdStudentProfile, activationEmailSent, activationEmailError };
};


const getAllStudentProfiles = async (accessContext, getStudentsQuery) => {
  const {
    by_student_name,
    by_roll_number,
    by_department_id,
    by_room_id,
    page, pageSize
  } = getStudentsQuery;

  const studentsWhere = { hostelId: accessContext.loggedInAdminHostelId };
  if (by_student_name?.trim()) studentsWhere.studentName = { contains: by_student_name.trim(), mode: "insensitive" };
  if (by_roll_number?.trim()) studentsWhere.rollNumber = by_roll_number.trim();
  if (by_department_id > 0) studentsWhere.departmentId = by_department_id;
  if (by_room_id > 0) studentsWhere.roomId = by_room_id;

  const prismaPagination = toPrismaPagination(page, pageSize);

  const { students, studentsCount } = await StudentRepository.getAllStudentProfiles(studentsWhere, prismaPagination.skip, prismaPagination.take);

  const paginationMeta = buildMeta(page, pageSize, studentsCount);
  return { students, paginationMeta };
};

const getOneStudentProfileById = async (id, user, accessContext) => {
  const hostelId = accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId;
  if (user.role.roleName !== "HOSTEL_ADMIN" && id !== user.studentProfile.id) throw createHttpError(403, "You cannot access another student's profile", { errors: "Invalid student profile id" });
  const oneStudent = await StudentRepository.getOneStudentProfileById(id, hostelId);
  if (oneStudent === null) throw createHttpError(404, `Student with id ${id} is not found`, { errors: "Student id not found in the database" });
  let studentImageUrl = null;
  if (oneStudent.studentImageKey) {
    studentImageUrl = await getS3SignedUrlByKey(oneStudent.studentImageKey, 3600);
  }
  return { ...oneStudent, studentImageUrl };
};

const updateStudentProfile = async (id, updateStudentProfileRequestBody, accessContext) => {
  const {
    email,
    studentName,
    contactNumber,
    parentMobileNumber,
    departmentId,
    studentImageKey,
    roomId
  } = updateStudentProfileRequestBody;

  //check studentprofile with that id is present in db or not , then only we can update it - college and hostel scoped
  const studentProfile = await StudentRepository.findStudentProfileById(id, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!studentProfile) throw createHttpError(404, `Student profile with id ${id} not found`, { errors: "Invalid id" });

  //check whether this student's status is active or not -> if active then only can update else not - college and hostel scope may need or may not 
  const user = await StudentRepository.findUserById(studentProfile.userId);
  if (user.status !== "ACTIVE") throw createHttpError(409, `Student profile is not active, currently its ${user.status}, so if want then change the status of the student profile and update`, { errors: "Student profile is not active" });

  //a new photo must show one clear, front-facing face (see createStudent)
  if (studentImageKey && studentImageKey !== studentProfile.studentImageKey) await assertStudentPhotoUsable(studentImageKey);

  return await prisma.$transaction(async (tx) => {

    if (email) {
      //check passed email is unique or not 
      //(the student's own current email is not a conflict)
      const existingUserOfThisEmail = await StudentRepository.findUserByEmail(tx, email);
      if (existingUserOfThisEmail && existingUserOfThisEmail.id !== studentProfile.userId) throw createHttpError(409, "Email already in use", { errors: "Invalid email" });

      //here, email validation passed so now we can update the email and email present in user model so update it 
      const updatedUser = await StudentRepository.updateEmailOfUser(tx, studentProfile.userId, email);
    }

    if (contactNumber) {
      //contact number is unique field so if passed we should check and update it
      const existingStudentProfileWithThisContactNumber = await StudentRepository.findStudentProfileByContactNumber(tx, contactNumber);
      if (existingStudentProfileWithThisContactNumber && existingStudentProfileWithThisContactNumber.id !== studentProfile.id) throw createHttpError(409, "Student profile with this new contact number is already exists", { errors: "Contact number already exists" });

      //update -> contact number but since all other fields are also in studentprofile entity we can update in 1 query at last after all validations are passed
    }

    if (departmentId) {
      //check department exists or not 
      const department = await StudentRepository.findDepartmentById(tx, departmentId, accessContext.loggedInAdminCollegeId);
      if (!department) throw createHttpError(404, `Department not found`, { errors: "Invalid department id" });

      //check this department's college belongs to logged hostel_admin's hostel's college or not 
      // so for that department.collegeId is need which we already have now we need logged in hostel_admin's collegeId , 
      //so we already have hostelId which is logged in hostel_admin's hostel id so using that we can find that hostel and we can get hostel.collegeId of that
      // const hostelOfLoggedInHostelAdmin = await StudentRepository.findHostelById(tx, accessContext.loggedInAdminHostelId);
      // if(!hostelOfLoggedInHostelAdmin) throw createHttpError(404, "Hostel id is not found", "Invalid hostel id of logged in admin");

      if (department.collegeId !== accessContext.loggedInAdminCollegeId) throw createHttpError(409, "Invalid college id passed, you cannot change this student profile to this college id", { errors: "Hostel admin's hostel doesn't belongs to this college id" });
    }

    if (roomId) {
      //check roomId is valid or not 
      const room = await StudentRepository.findRoomById(tx, roomId, accessContext.loggedInAdminHostelId);
      if (!room) throw createHttpError(404, `Room not found with id as ${roomId}`, { errors: "Invalid room id" });

      //check this room.hostelId belongs to logged in hostel admin's hostel id or not
      if (room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, "You cannot assign room which is not belongs to your hostel", { errors: "Invalid room id" });

      //staying in the same room doesn't need a free bed
      if (room.id !== studentProfile.roomId && room.capacity <= room._count.studentProfiles) throw createHttpError(409, "Room is already full", { errors: "Invalid room id" });
    }

    //ALL validations are passed so update student profile
    const updatedStudentProfile = await StudentRepository.updateStudentProfile(tx, studentProfile.id, studentName, contactNumber, parentMobileNumber, departmentId, roomId, studentImageKey);

    return updatedStudentProfile;
  });
};

const updateStatusOfStudent = async (studentId, status, accessContext) => {
  //check student with id is present or not - college or hostel scoped
  const student = await StudentRepository.findStudentProfileById(studentId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!student) throw createHttpError(404, `Student with id ${studentId} not found`, { errors: "Invalid student id" });

  //check the passed status and already student's status is same or not , if same throw error that its already in that staus only
  if (status === student.user.status) throw createHttpError(409, `Student's status is already ${student.user.status}`, { errors: "Invalid status" });

  //a pending student has no password yet, so they can only become ACTIVE by opening the activation link
  if (student.user.status === "PENDING_ACTIVATION" && status === "ACTIVE") throw createHttpError(409, "This student hasn't activated their account yet. Resend the activation link instead", { errors: "Account not activated" });

  const updatedUserProfileOfThatStudent = await StudentRepository.updateStatusOfStudent(student.user.id, status); //here scope may need or may not need - here i didn't do because the user id is get from student.user.id and that student is fetched after passing scope so
  return StudentRepository.findStudentProfileById(studentId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
};

const changeOrAssignStudentRoom = async (studentId, roomId, accessContext) => {
  //check student with id present or not
  const studentProfile = await StudentRepository.findStudentProfileById(studentId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!studentProfile) throw createHttpError(404, `Student with id ${studentId} not found`, { errors: "Invalid student id" });

  //check room with id present or not
  const room = await StudentRepository.findRoomById(prisma, roomId, accessContext.loggedInAdminHostelId);
  if (!room) throw createHttpError(404, `Room not found with id ${roomId}`, { errors: "Invalid room id" });

  //check that the student belongs to logged in admin's hostel or not 
  if (studentProfile.room && studentProfile.room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, "The student doen't belongs to your hostel", { errors: "Invalid student id" });

  //room.hostel id must match with logged admin hostel id
  if (room.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(409, `This room doesn't belongs to your hostel`, { errors: "Invalid room id" });

  if (studentProfile.roomId === roomId) throw createHttpError(409, "The student is already in this room", { errors: "Same room" });

  //check room has capacity or not
  if (room._count.studentProfiles >= room.capacity) throw createHttpError(409, `Room is alread full (capacity - ${room.capacity})`, { errors: "Room is full" });

  //ok now room has capacity so now can assign (or change) that room to that student
  const roomAssignedOrChangedStudentProfile = await StudentRepository.updateRoomOfThestudent(studentId, roomId); //here also the passed student id is validated that this is college scoped and hostel scoped because at first line of this service function itself student fetched using this studentId is scoped by college as well as hostel

  return roomAssignedOrChangedStudentProfile;

};

const getStudentSplashScreenData = async (accessContext) => {
  //In home screen , Mark attendance button will be shown only when the corressponding hostel's attendance marking time is achieved so checking the current time is equal or more than that and within end time also
  const hostel = await StudentRepository.getHostelOftheStudent(accessContext.loggedInStudentHostelId);
  if (!hostel) {
    throw createHttpError(404, "Hostel not found");
  }

  //details the app needs to show the right attendance card (marked / photo needed / on leave / open / not open yet / closed)
  const [todayMarkedAttendace, studentImageKey, approvedLeaveToday] = await Promise.all([
    StudentRepository.getTodayMarkedAttendanceOfStudent(accessContext.loggedInStudentProfileId),
    StudentRepository.getStudentImageKeyOfStudent(accessContext.loggedInStudentProfileId),
    StudentRepository.getApprovedLeaveCoveringToday(accessContext.loggedInStudentProfileId)
  ]);

  //where "now" (IST) sits relative to tonight's attendance window (same helper markAttendance uses)
  const attendanceWindowState = getAttendanceWindowState(hostel.attendanceMarkingStartTime, hostel.attendanceMarkingEndTime);

  //the button shows only while the window is open, the student hasn't marked today and has a profile photo
  //(to test at other hours, change the window in hostel settings)
  const canMarkAttendance = attendanceWindowState === "OPEN" && !todayMarkedAttendace && Boolean(studentImageKey);

  const announcementsData = await StudentRepository.getAnnouncementsData(accessContext.loggedInStudentHostelId);
  const upcomingEventsData = await StudentRepository.getUpcomingEventsData(accessContext.loggedInStudentHostelId);

  return {
    canMarkAttendance,
    attendanceWindowState,
    todayAttendance: todayMarkedAttendace ? {
      id: todayMarkedAttendace.id,
      reportedTime: todayMarkedAttendace.reportedTime,
      isLocatedWithinHostelRadius: todayMarkedAttendace.isLocatedWithinHostelRadius,
      locationDeviationFromHostel: todayMarkedAttendace.locationDeviationFromHostel
    } : null,
    hasProfilePhoto: Boolean(studentImageKey),
    approvedLeaveToday,
    announcements: announcementsData,
    upcomingEvents: upcomingEventsData,
    hostel
  };

};

const setupNewPassword = async (accessContext, setupNewPasswordRequestBody) => {
  const {
    token,
    newPassword,
  } = setupNewPasswordRequestBody;

  //token validations
  //checking token exist or not
  const tokenFromDB = await StudentRepository.findToken(getHashedVersionOfToken(token));

  if (!tokenFromDB) throw createHttpError(404, "Token not found", { errors: "Token not found in DB" });

  if (new Date() > tokenFromDB.expiresAt) throw createHttpError(422, "Link expired, contact your hostel admin to get activation link again", { errors: "Token expired" });

  if (tokenFromDB.usedAt) throw createHttpError(422, "Token already used, contact hostel admin for account activation if you need", { errors: "Token already used" });

  //token is valid now, so setup the new password to user
  const user = await StudentRepository.findUserById(tokenFromDB.userId);
  if (!user) throw createHttpError(404, "User not found", { errors: "User not found" });

  if (tokenFromDB.purpose === "ACCOUNT_ACTIVATION") {
    if (user.status !== "PENDING_ACTIVATION") {
      throw createHttpError(
        422,
        "Account activation token is not valid for this account",
        { errors: "Invalid account status for activation" }
      );
    }
  }

  if (tokenFromDB.purpose === "PASSWORD_RESET") {
    if (user.status !== "ACTIVE") {
      throw createHttpError(
        403,
        "Account is not active, contact admin",
        { errors: "Account is not active" }
      );
    }
  }

  const hashedPassword = await getHasedVersionOfPassword(newPassword);

  await StudentRepository.consumeAccountTokenAndSetPassword(tokenFromDB, hashedPassword);
  //change password of user
  // const passwordUpdatedUser = await StudentRepository.setupNewPasswordToUser(tokenFromDB.userId, hashedPassword);

  // //update usedAt column of accountsetuptoken
  // const updatedAccountSetupTokenRecord = await StudentRepository.updateAccountSetupTokenRecord(tokenFromDB.id);

  return "Password updated successfully, now login with new password";
};


const getAllDepartments = async (accessContext) => {
  return await StudentRepository.getAllDepartments(accessContext.loggedInAdminCollegeId);
};

const sendActivationLinkMail = async (accessContext, studentProfileId) => {
  const student = await StudentRepository.findStudentProfileById(studentProfileId);
  if (!student) throw createHttpError(404, "Student profile not found", { errors: "Invalid student profile id" });

  if (student.hostelId != accessContext.loggedInAdminHostelId) throw createHttpError(403, "The student doesn't belong to your hostel", { errors: "Un authorized access" });

  if (student.user.status !== "PENDING_ACTIVATION") throw createHttpError(409, `Student account is in ${student.user.status} so cannot send activation link, student account status must be at pending verification status`, { errors: "Student account status is not PENDING_VERIFCATION so cannot send activation mail" });

  //can send mail now 
  const { rawToken, hashedToken } = generateActivationToken();
  const expiresAt = new Date(Date.now() + ACTIVATION_LINK_TTL_MS);

  await StudentRepository.createAccountSetupTokenRecord(null, student.user.id, hashedToken, expiresAt, "ACCOUNT_ACTIVATION");

  const hostel = await StudentRepository.getHostelOftheStudent(student.hostelId);
  const activationEmail = accountActivationEmail({
    studentName: student.studentName,
    hostelName: hostel?.hostelName,
    link: setupPasswordLink(rawToken, "welcome"),
    expiresAt: formatIstDateTime(expiresAt),
  });
  try {
    await sendEmail(student.user.email, activationEmail.subject, activationEmail.text, activationEmail.html);
  } catch (err) {
    console.error("Activation email failed for user " + student.user.id, err);
    //tell the admin why (e.g. Amazon SES still in sandbox mode) instead of "something went wrong"
    //503, not 502: Cloudflare replaces an origin's 502 with its own error page, which hides this message from the admin
    throw createHttpError(503, `Couldn't send the activation email: ${describeEmailError(err)}.`, { errors: "Email not sent" });
  }

  return "Account activation email sent";
};

const forgotPasswordRequest = async (forgotPasswordRequestBody) => {
  const {
    email
  } = forgotPasswordRequestBody;

  //same answer whether or not the email exists, so this endpoint can't be used to find out who has an account
  const genericResponse = "If this email belongs to an active account, a password reset link has been sent";

  //this is actually user table's record
  const studentInThisEmail = await StudentRepository.findUserByEmail(null, email);
  if (!studentInThisEmail || studentInThisEmail.status !== "ACTIVE") return genericResponse;

  const { rawToken, hashedToken } = generateActivationToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_LINK_TTL_MS);

  await StudentRepository.createAccountSetupTokenRecord(null, studentInThisEmail.id, hashedToken, expiresAt, "PASSWORD_RESET");

  const profile = await StudentRepository.getStudentNameByUserId(studentInThisEmail.id);
  const resetEmail = passwordResetEmail({
    studentName: profile?.studentName,
    email: studentInThisEmail.email,
    link: setupPasswordLink(rawToken, "reset"),
    expiresAt: formatIstDateTime(expiresAt),
  });
  try {
    await sendEmail(studentInThisEmail.email, resetEmail.subject, resetEmail.text, resetEmail.html);
  } catch (err) {
    console.error("Password reset email failed for user " + studentInThisEmail.id, err);
  }

  return genericResponse;
};

//admin app: checks a just-uploaded photo before the student is saved, so problems
//(no face, blurry, dark, turned away, too small, ...) are shown right away
const checkStudentImage = async (studentImageKey) => {
  return await checkStudentPhoto(studentImageKey);
};

const StudentService = {
  checkStudentImage,
  createStudent,
  getAllStudentProfiles,
  getOneStudentProfileById,
  updateStudentProfile,
  updateStatusOfStudent,
  changeOrAssignStudentRoom,
  getStudentSplashScreenData,
  setupNewPassword,
  getAllDepartments,
  sendActivationLinkMail,
  forgotPasswordRequest
};

export default StudentService;