import { prisma } from "../../configs/db.js";
import { subtractMonths } from "../../utils/dates.utils.js";

const findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting = async (studentId) => {
  return await prisma.leaveApplication.findFirst({
    where: {
      studentId: studentId,
      status: "WAITING_FOR_APPROVAL"
    }
  });
};

const findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved = async (studentId, fromDate, toDate) => {
  return await prisma.leaveApplication.findFirst({
    where: {
      studentId: studentId,
      status: "APPROVED",
      ...((fromDate && toDate) && ({
        fromDate: {
        lte: new Date(toDate)
      },
      toDate: {
        gte: new Date(fromDate)
      }
      }))
    },
  });
};

const createLeaveApplication = async (studentId, leaveReason, fromDate, toDate) => {
  return await prisma.leaveApplication.create({
    data: {
      leaveReason: leaveReason,
      fromDate: fromDate,
      toDate: toDate,
      studentId: studentId
    }
  });
};

const findLeaveApplicationById = async (id, hostelId) => {
  return await prisma.leaveApplication.findUnique({
    where: {
      id: id,
      student: {
        hostelId: hostelId
      }
    }
  });
};

const updateLeaveApplication = async (id, leaveReason, fromDate, toDate) => {
  return prisma.leaveApplication.update({
    where: {
      id: id
    },
    data: {
      leaveReason: leaveReason ?? undefined,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined
    }
  });
};

const getAllLeaveApplications = async (leaveApplicationWhere, skip, take) => {
  return await prisma.leaveApplication.findMany({
    where: leaveApplicationWhere,
    include: {
      student: {
        select: {
          studentName: true,
          contactNumber: true,
          parentMobileNumber: true,
          rollNumber: true,
          studentImageKey: true,
          department: {
            select: {
              departmentName: true
            }
          },
          room: {
            select: {
              roomNumber: true
            }
          }
        }
      }
    },
    skip,
    take
  });
};

const getOneLeaveApplication = async (id, hostelId) => {
  return await prisma.leaveApplication.findFirst({
    where: {
      id: id,
      student: {
        hostelId: hostelId
      }
    }
  });
};

const reviewLeaveApplication = async (id, status, rejectionReason) => {
  return await prisma.leaveApplication.update({
    where: {
      id: id
    },
    data: {
      status: status,
      rejectionReason: rejectionReason ?? undefined
    }
  });
};

const cancelLeaveApplication = async (leaveApplicationId, studentId) => {
  return await prisma.leaveApplication.update({
    where: {
      id: leaveApplicationId,
    },
    data: {
      status: "CANCELLED"
    }
  });
};

const getOneStudentLeaveApplications = async (studentProfileId) => {
  return await prisma.leaveApplication.findMany({
    where: {
      studentId: studentProfileId
    }
  });
};

const getOneStudentOneLeaveApplication = async (studentProfileId, leaveApplicationId) => {
  return await prisma.leaveApplication.findFirst({
    where: {
      id: leaveApplicationId,
      studentId: studentProfileId
    }
  });
};

const getTotalLeaveApplicationCount = async (leaveApplicationWhere) => {
  return await prisma.leaveApplication.count({
    where: leaveApplicationWhere
  });
};

const getCountOfStatuses = async (statusesWhere) => {
  const groups = await prisma.leaveApplication.groupBy({
    by: ["status"],
    where: statusesWhere,
    _count: {
      _all: true
    }
  });

  const counts = {
    WAITING_FOR_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0
  }; 

  for(const group of groups) {
    counts[group.status] = group._count._all
  }
  return counts;
};

const previoudTwoMonthLeavesOfThatStudent = async (studentId) => {
  const twoMonthsBeforeDate = subtractMonths(new Date(), 2);
  
  return await prisma.leaveApplication.findMany({
    where: {
      studentId: studentId,
      fromDate: {
        gte: twoMonthsBeforeDate
      }
    }
  });
};

const LeaveApplicationRepository = {
  findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting,
  findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved,
  createLeaveApplication,
  findLeaveApplicationById,
  updateLeaveApplication,
  getAllLeaveApplications,
  getOneLeaveApplication,
  reviewLeaveApplication,
  cancelLeaveApplication,
  getOneStudentLeaveApplications,
  getOneStudentOneLeaveApplication,
  getTotalLeaveApplicationCount,
  getCountOfStatuses,
  previoudTwoMonthLeavesOfThatStudent
};

export default LeaveApplicationRepository;