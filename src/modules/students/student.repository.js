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

const findDepartmentById = async (tx, departmentId) => {
  const department = await tx.department.findUnique({
    where: {
      id: departmentId
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

const findRoomById = async (tx, roomId) => {
  return await tx.room.findUnique({
    where: {
      id: roomId
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

const findRoleById = (tx, roleName) => {
  return tx.role.findUnique({
    where: {
      roleName: roleName
    }
  });
};

const createUser = async (tx, email, passwordHash, roleId) => {
  return tx.user.create({
    data: {
      email: email,
      passwordHash: passwordHash,
      roleId: roleId
    }
  });
};

const createStudentProfile = async (tx, studentName, contactNumber, parentMobileNumber, userId, departmentId, roomId) => {
  return await tx.studentProfile.create({
    data: {
      studentName: studentName,
      contactNumber: contactNumber,
      parentMobileNumber: parentMobileNumber,
      userId: userId,
      departmentId: departmentId,
      roomId: roomId ?? null
    }
  });
};

const getAllStudentProfiles = async () => {
  return await prisma.studentProfile.findMany();
};

const getOneStudentProfileById = async (id) => {
  return await prisma.studentProfile.findUnique({
    where: {
      id: id
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

const findStudentProfileById = async (id) => {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: {
      id: id
    },
    include: {
      user: true
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
      roomId: roomId ?? undefined
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

const StudentRepository = {
  findUserByEmail,
  findStudentProfileByContactNumber,
  findDepartmentById,
  findHostelById,
  findRoomById,
  findRoleById,
  createUser,
  createStudentProfile,
  getAllStudentProfiles,
  getOneStudentProfileById,
  updateEmailOfUser,
  findStudentProfileById,
  updateStudentProfile,
  findUserById,
  updateStatusOfStudent
};

export default StudentRepository;