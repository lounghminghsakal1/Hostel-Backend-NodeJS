import { prisma } from "../../configs/db.js";

const findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting = (studentId) => {
  return prisma.leaveApplication.findFirst({
    where: {
      studentId: studentId,
      status: "WAITING_FOR_APPROVAL"
    }
  });
};

const findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved = (studentId, fromDate, toDate) => {
  return prisma.leaveApplication.findFirst({
    where: {
      studentId: studentId,
      status: "APPROVED",
      fromDate: {
        lte: new Date(toDate)
      },
      toDate: {
        gte: new Date(fromDate)
      }
    },
  });
};

const createLeaveApplication = (studentId, leaveReason, fromDate, toDate) => {
  return prisma.leaveApplication.create({
    data: {
      leaveReason: leaveReason,
      fromDate: fromDate,
      toDate: toDate,
      studentId: studentId
    }
  });
};

const LeaveApplicationRepository = {
  findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting,
  findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved,
  createLeaveApplication,
};

export default LeaveApplicationRepository;