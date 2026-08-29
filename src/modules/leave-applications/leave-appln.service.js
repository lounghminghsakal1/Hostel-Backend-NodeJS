import createHttpError from "http-errors";
import LeaveApplicationRepository from "./leave-appln.repository";

const createLeaveApplication = (accessContext, createLeaveApplicationRequestBody) => {
  //check the student has any other leave application which status is waiting_for_review
  //because if already one leave application is pending then student can't make new one
  //if want student can cancel and apply a new one
  const leaveApplicationOfThisLoggedInStudentWithWaitingStatus = LeaveApplicationRepository.findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting(accessContext.loggedInStudentProfileId);
  if(leaveApplicationOfThisLoggedInStudentWithWaitingStatus) throw createHttpError(409, "Already a leave application is pending", {errors: "Complete existing leave application first"});

  const { leaveReason, fromDate, toDate } = createLeaveApplicationRequestBody;

  //the passes from date and to date should not overlap with existing approved leave application
  const leaveApplicationWithOverlappingTimePeriod = LeaveApplicationRepository.findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved(accessContext.loggedInStudentProfileId, fromDate, toDate);
  if(leaveApplicationWithOverlappingTimePeriod) throw createHttpError(409, "Already an approved leave application exists in that requested time period", {errors: "Invalid time period"});

  const createdLeaveApplication = LeaveApplicationRepository.createLeaveApplication(accessContext.loggedInStudentProfileId, leaveReason, fromDate, toDate);
  return createdLeaveApplication;

};

const LeaveApplicationService = {
  createLeaveApplication
};

export default LeaveApplicationService;