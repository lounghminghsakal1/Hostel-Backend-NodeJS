import { prisma } from "../../configs/db.js";

const findUserByEmail = async (tx, email) => {
  const user = await tx.user.findUnique({
    where: {
      email: email
    }
  });
  return user;
};

const findStudentProfileByContactNumber = async (tx, contactNumber) => {
  return await tx.studentProfile.findUnique({
    where: {
      contactNumber: contactNumber
    }
  });
};

const findDepartmentById = async (tx, departmentId, collegeId) => {
  const department = await tx.department.findFirst({
    where: {
      id: departmentId,
      collegeId: collegeId
    }
  });
  return department;
};

const findHostelById = async (tx, hostelId) => {
  return await tx.hostel.findUnique({
    where: {
      id: hostelId
    }
  });
};

const findRoomById = async (tx, roomId, hostelId) => {
  return await tx.room.findFirst({
    where: {
      id: roomId,
      hostelId: hostelId
    },
    select: {
      id: true,
      hostelId: true,
      capacity: true,
      _count: {
        select: {
          studentProfiles: true
        },
      }
    }
  });
};

const findRoleByRoleName = (tx, roleName) => {
  return tx.role.findUnique({
    where: {
      roleName: roleName
    }
  });
};

const createUser = async (tx, email, passwordHash, roleId, collegeId) => {
  return tx.user.create({
    data: {
      email: email,
      passwordHash: passwordHash,
      roleId: roleId,
      collegeId: collegeId,
      mustChangePassword: true
    }
  });
};

const createStudentProfile = async (tx, studentName, contactNumber, parentMobileNumber, userId, departmentId, roomId, studentImageUrl, collegeId, hostelId) => {
  return await tx.studentProfile.create({
    data: {
      studentName: studentName,
      contactNumber: contactNumber,
      parentMobileNumber: parentMobileNumber,
      userId: userId,
      departmentId: departmentId,
      studentImageUrl: studentImageUrl ?? null,
      roomId: roomId ?? null,
      collegeId: collegeId,
      hostelId: hostelId
    }
  });
};

const getAllStudentProfiles = async (hostelId, collegeId) => {
  return await prisma.studentProfile.findMany({
    where: {
      hostelId: hostelId,
      collegeId: collegeId
    }
  });
};

const getOneStudentProfileById = async (id, hostelId, collegeId) => {
  return await prisma.studentProfile.findFirst({
    where: {
      id: id,
      hostelId: hostelId,
      collegeId: collegeId
    }
  });
};

const updateEmailOfUser = async (tx, userId, email) => {
  return await tx.user.update({
    where: {
      id: userId
    },
    data: {
      email: email
    },
    select: {
      id: true,
      email: true,
      studentProfile: true
    }
  });
};

const findStudentProfileById = async (id, hostelId, collegeId) => {
  const studentProfile = await prisma.studentProfile.findFirst({
    where: {
      id: id,
      hostelId: hostelId,
      collegeId: collegeId
    },
    include: {
      user: true,
      room:true
    }
  });
  return studentProfile;
};

const updateStudentProfile = async (tx, id, studentName, contactNumber, parentMobileNumber, departmentId, roomId) => {
  
  return tx.studentProfile.update({
    where: {
      id: id
    },
    data: {
      studentName: studentName ?? undefined,
      contactNumber: contactNumber ?? undefined,
      parentMobileNumber: parentMobileNumber ?? undefined,
      departmentId: departmentId ?? undefined,
      studentImageUrl: studentImageUrl ?? undefined,
      roomId: roomId ?? undefined,
    }
  });
};

const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id: id
    }
  });
};

const updateStatusOfStudent = async (userId, status) => {
  const updatedStudent = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      status: status
    }
  });
  return updatedStudent;
};

const updateRoomOfThestudent = async (studentId, roomId) => {
  return await prisma.studentProfile.update({
    where: {
      id: studentId 
    },
    data: {
      roomId: roomId
    },
    include: {
      room: true
    }
  });
};

const StudentRepository = {
  findUserByEmail,
  findStudentProfileByContactNumber,
  findDepartmentById,
  findHostelById,
  findRoomById,
  findRoleByRoleName,
  createUser,
  createStudentProfile,
  getAllStudentProfiles,
  getOneStudentProfileById,
  updateEmailOfUser,
  findStudentProfileById,
  updateStudentProfile,
  findUserById,
  updateStatusOfStudent,
  updateRoomOfThestudent
};

export default StudentRepository;