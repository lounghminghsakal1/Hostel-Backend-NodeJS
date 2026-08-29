import { prisma } from "../../configs/db.js";

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

const getAllLeaveApplications = async (hostelId) => {
  return await prisma.leaveApplication.findMany({
    where: {
      student: {
        hostelId: hostelId
      }
    }
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
};

export default LeaveApplicationRepository;