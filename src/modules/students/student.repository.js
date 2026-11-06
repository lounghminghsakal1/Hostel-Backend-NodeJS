import { prisma } from "../../configs/db.js";
import { currentDate, currentDateForDb } from "../../utils/dates.utils.js";
import createHttpError from "http-errors";

//case-insensitive, so "Rohan@College.edu" and "rohan@college.edu" are the same account
const findUserByEmail = async (tx, email) => {
  const client = tx ?? prisma;
  return await client.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive"
      }
    }
  });
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

const createUser = async (tx, email, roleId, collegeId) => {
  return tx.user.create({
    data: {
      email: email.trim().toLowerCase(),
      roleId: roleId,
      collegeId: collegeId,
      mustChangePassword: true
    }
  });
};

const createStudentProfile = async (tx, studentName, contactNumber, parentMobileNumber, userId, departmentId, rollNumber, roomId, studentImageKey, collegeId, hostelId) => {
  return await tx.studentProfile.create({
    data: {
      studentName: studentName,
      contactNumber: contactNumber,
      parentMobileNumber: parentMobileNumber,
      userId: userId,
      departmentId: departmentId,
      studentImageKey: studentImageKey ?? null,
      rollNumber: rollNumber,
      roomId: roomId ?? null,
      collegeId: collegeId,
      hostelId: hostelId
    }
  });
};

const getAllStudentProfiles = async (studentsWhere, skip, take) => {
  const students = await prisma.studentProfile.findMany({
    where: studentsWhere,
    orderBy: { id: "asc" },
    include: {
      user: {
        select: {
          email: true,
          status: true
        }
      },
      department: {
        select: {
          departmentName: true,
          id: true
        }
      },
      room: {
        select: {
          roomNumber: true,
          id: true
        }
      }
    },
    skip,
    take
  });

  const studentsCount = await prisma.studentProfile.count({
    where: studentsWhere
  });

  return { students, studentsCount };
};

const getOneStudentProfileById = async (id, hostelId) => {
  return await prisma.studentProfile.findFirst({
    where: {
      id: id,
      hostelId: hostelId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true
        }
      },
      room: {
        select: {
          id: true,
          roomNumber: true
        }
      },
      department: {
        select: {
          id: true,
          departmentName: true
        }
      },
    }
  });
};

const updateEmailOfUser = async (tx, userId, email) => {
  return await tx.user.update({
    where: {
      id: userId
    },
    data: {
      email: email.trim().toLowerCase()
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
      //never load passwordHash here: this result is returned by PATCH /students/:id/status
      user: {
        select: {
          id: true,
          email: true,
          status: true
        }
      },
      room: true
    }
  });
  return studentProfile;
};

const updateStudentProfile = async (tx, id, studentName, contactNumber, parentMobileNumber, departmentId, roomId, studentImageKey) => {

  return tx.studentProfile.update({
    where: {
      id: id
    },
    data: {
      studentName: studentName ?? undefined,
      contactNumber: contactNumber ?? undefined,
      parentMobileNumber: parentMobileNumber ?? undefined,
      departmentId: departmentId ?? undefined,
      studentImageKey: studentImageKey ?? undefined,
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

const getHostelOftheStudent = async (hostelIdOfStudent) => {
  return await prisma.hostel.findUnique({
    where: {
      id: hostelIdOfStudent
    },
    select: {
      id: true,
      hostelName: true,
      attendanceMarkingStartTime: true,
      attendanceMarkingEndTime: true
    }
  });
};

const getTodayMarkedAttendanceOfStudent = async (studentProfileId) => {
  return await prisma.attendanceRecord.findFirst({
    where: {
      studentId: studentProfileId,
      attendanceDate: currentDateForDb() //IST calendar date, same value markAttendance saves
    }
  });
};

//splash screen -> to tell the student up front that attendance needs a profile photo on file
const getStudentImageKeyOfStudent = async (studentProfileId) => {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: {
      id: studentProfileId
    },
    select: {
      studentImageKey: true
    }
  });
  return studentProfile?.studentImageKey ?? null;
};

//splash screen -> approved leave that covers today's (IST) calendar date, if any
const getApprovedLeaveCoveringToday = async (studentProfileId) => {
  const today = new Date(`${currentDate()}T00:00:00.000Z`);
  return await prisma.leaveApplication.findFirst({
    where: {
      studentId: studentProfileId,
      status: "APPROVED",
      fromDate: { lte: today },
      toDate: { gte: today }
    },
    select: {
      id: true,
      fromDate: true,
      toDate: true
    }
  });
};

const createAccountSetupTokenRecord = async (tx, userId, tokenHash, expiresAt, purpose) => {
  return tx ? await tx.accountSetupToken.create({
    data: {
      userId: userId,
      tokenHash: tokenHash,
      expiresAt: expiresAt,
      purpose: purpose
    }
  }) : await prisma.accountSetupToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      purpose
    }
  });
};

const findToken = async (hashedToken) => {
  return await prisma.accountSetupToken.findFirst({
    where: {
      tokenHash: hashedToken
    }
  });
};

const setupNewPasswordToUser = async (userId, hashedPassword, tx) => {
  return tx ? await tx.user.update({
    where: {
      id: userId
    },
    data: {
      passwordHash: hashedPassword,
      status: "ACTIVE"
    }
  }) : await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      passwordHash: hashedPassword,
      status: "ACTIVE"
    }
  });
};

const updateAccountSetupTokenRecord = async (id, tx) => {
  return tx ? await tx.accountSetupToken.update({
    where: {
      id: id,
      purpose: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: {
        gt: new Date()
      },
    },
    data: {
      usedAt: new Date()
    }
  }) : await prisma.accountSetupToken.update({
    where: {
      id: id
    },
    data: {
      usedAt: new Date()
    }
  });
};

const getAllDepartments = async (collegeId) => {
  return await prisma.department.findMany({
    where: {
      collegeId: collegeId
    }
  });
};

const getAnnouncementsData = async (hostelId) => {
  const today = new Date(`${currentDate()}T00:00:00.000Z`);

  return await prisma.announcement.findMany({
    where: {
      hostelId: hostelId,
      status: "ACTIVE",
      startDate: {
        lte: today
      },
      endDate: {
        gte: today
      }
    },
    take: 5,
    orderBy: {
      isImportant: "desc"
    }
  });
};

const getUpcomingEventsData = async (hostelId) => {
  return await prisma.upcomingEvent.findMany({
    where: {
      hostelId,
      isActive: true,
      endingAt: {
        gte: new Date()
      }
    },
    orderBy: [
      { startingAt: "asc" },
      { id: "asc" }
    ],
    take: 5,
  });
};

const setupNewPasswordAndUpdateAccountSetupTokenRecord = async (tokenFromDB, hashedPassword) => {
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.accountSetupToken.updateMany({
      where: {
        id: tokenFromDB.id,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        usedAt: new Date()
      }
    });

    if (consumed.count !== 1) {
      throw createHttpError(422, "Token expired or already used");
    }

    await tx.user.update({
      where: {
        id: tokenFromDB.userId
      },
      data: {
        passwordHash: hashedPassword,
        ...(tokenFromDB.purpose === "ACCOUNT_ACTIVATION" ? { status: "ACTIVE"} : {})
        // Do not set status: "ACTIVE"
      }
    });

    const sessions = await tx.authSession.findMany({
      where: {
        userId: tokenFromDB.userId
      },
      select: {
        id: true
      }
    });

    const sessionIds = sessions.map(session => session.id);

    await tx.refreshToken.updateMany({
      where: {
        authSessionId: {
          in: sessionIds
        },
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await tx.authSession.updateMany({
      where: {
        id: {
          in: sessionIds
        },
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  });
};

const consumeAccountTokenAndSetPassword = async (
  tokenFromDB,
  hashedPassword
) => {
  return prisma.$transaction(async (tx) => {
    const consumedToken = await tx.accountSetupToken.updateMany({
      where: {
        id: tokenFromDB.id,
        tokenHash: tokenFromDB.tokenHash,
        purpose: tokenFromDB.purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        usedAt: new Date()
      }
    });

    if (consumedToken.count !== 1) {
      throw createHttpError(
        422,
        "Token expired or already used",
        { errors: "Invalid token" }
      );
    }

    if (tokenFromDB.purpose === "ACCOUNT_ACTIVATION") {
      const activatedUser = await tx.user.updateMany({
        where: {
          id: tokenFromDB.userId,
          status: "PENDING_ACTIVATION"
        },
        data: {
          passwordHash: hashedPassword,
          status: "ACTIVE",
          mustChangePassword: false
        }
      });

      if (activatedUser.count !== 1) {
        throw createHttpError(
          422,
          "Account cannot be activated",
          { errors: "Invalid account status" }
        );
      }

      return;
    }

    if (tokenFromDB.purpose === "PASSWORD_RESET") {
      const updatedUser = await tx.user.updateMany({
        where: {
          id: tokenFromDB.userId,
          status: "ACTIVE"
        },
        data: {
          passwordHash: hashedPassword,
          mustChangePassword: false
        }
      });

      if (updatedUser.count !== 1) {
        throw createHttpError(
          403,
          "Account is not active",
          { errors: "Account is not active" }
        );
      }

      const sessions = await tx.authSession.findMany({
        where: {
          userId: tokenFromDB.userId,
          revokedAt: null
        },
        select: {
          id: true
        }
      });

      const sessionIds = sessions.map(session => session.id);

      if (sessionIds.length > 0) {
        const revokedAt = new Date();

        await tx.refreshToken.updateMany({
          where: {
            authSessionId: {
              in: sessionIds
            },
            revokedAt: null
          },
          data: {
            revokedAt
          }
        });

        await tx.authSession.updateMany({
          where: {
            id: {
              in: sessionIds
            },
            revokedAt: null
          },
          data: {
            revokedAt
          }
        });
      }

      return;
    }

    throw createHttpError(
      422,
      "Unsupported token purpose",
      { errors: "Invalid token purpose" }
    );
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
  updateRoomOfThestudent,
  getHostelOftheStudent,
  getTodayMarkedAttendanceOfStudent,
  getStudentImageKeyOfStudent,
  getApprovedLeaveCoveringToday,
  createAccountSetupTokenRecord,
  findToken,
  setupNewPasswordToUser,
  updateAccountSetupTokenRecord,
  getAllDepartments,
  getAnnouncementsData,
  getUpcomingEventsData,
  setupNewPasswordAndUpdateAccountSetupTokenRecord,
  consumeAccountTokenAndSetPassword
};

export default StudentRepository;