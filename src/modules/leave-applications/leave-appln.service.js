import createHttpError from "http-errors";
import LeaveApplicationRepository from "./leave-appln.repository.js";

const createLeaveApplication = async (accessContext, createLeaveApplicationRequestBody) => {
  //check the student has any other leave application which status is waiting_for_review
  //because if already one leave application is pending then student can't make new one
  //if want student can cancel and apply a new one
  const leaveApplicationOfThisLoggedInStudentWithWaitingStatus = await LeaveApplicationRepository.findLeaveApplicationOdStudentByStudentIdWithStatusAsWaiting(accessContext.loggedInStudentProfileId);
  if(leaveApplicationOfThisLoggedInStudentWithWaitingStatus) throw createHttpError(409, "Already a leave application is pending", {errors: "Complete existing leave application first"});

  const { leaveReason, fromDate, toDate } = createLeaveApplicationRequestBody;

  //the passes from date and to date should not overlap with existing approved leave application
  const leaveApplicationWithOverlappingTimePeriod = await LeaveApplicationRepository.findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved(accessContext.loggedInStudentProfileId, fromDate, toDate);
  if(leaveApplicationWithOverlappingTimePeriod) throw createHttpError(409, "Already an approved leave application exists in that requested time period", {errors: "Invalid time period"});

  const createdLeaveApplication = await LeaveApplicationRepository.createLeaveApplication(accessContext.loggedInStudentProfileId, leaveReason, fromDate, toDate);
  return createdLeaveApplication;
};

const updateLeaveApplication = async (accessContext, leaveApplicationId, updateLeaveApplicationRequestBody) => {
  //check whether leave application with id exists or not
  const leaveApplication = await LeaveApplicationRepository.findLeaveApplicationById(leaveApplicationId, accessContext.loggedInStudentHostelId);
  if(!leaveApplication) throw createHttpError(404, `Leave application with ${leaveApplicationId} not found`, {errors: "Invalid id"});

  if(leaveApplication.status !== "WAITING_FOR_APPROVAL") throw createHttpError(409, "Leave application is not in pending status, only pending status leave applications can be updated/edited", { errors: "Invalid request"});

  const { leaveReason, fromDate, toDate } = updateLeaveApplicationRequestBody;

  if((fromDate && !toDate) || (!fromDate && toDate)) throw createHttpError(409, "Please provide both from date and to date or provide neither", {errors: "Both from date and to date must be present or nothing(atomic)"})
  
  const leaveApplicationWithOverlappingTimePeriod = await LeaveApplicationRepository.findLeaveApplicationOfStudentWithOverLappingTimePeriodAndApproved(accessContext.loggedInStudentProfileId, fromDate, toDate);
  if(leaveApplicationWithOverlappingTimePeriod) throw createHttpError(409, "The requested time period(fromDate and toDate) overlapping with exisitng approved leave application", {errors: "Invalid date periods"});

  const updatedLeaveApplication = await LeaveApplicationRepository.updateLeaveApplication(leaveApplicationId, leaveReason, fromDate, toDate);
  return updatedLeaveApplication;

};

const getAllLeaveApplications = async (accessContext) => {
  const allLeaveApplications = await LeaveApplicationRepository.getAllLeaveApplications(accessContext.loggedInAdminHostelId);
  return allLeaveApplications;
};

const getOneLeaveApplication = async (accessContext, id) => {
  const leaveApplication = await LeaveApplicationRepository.getOneLeaveApplication(id, accessContext.loggedInAdminHostelId);
  if(!leaveApplication) throw createHttpError(404, `Leave application with id ${id} is not found`, {errors: "Invalid leave application id"});
  return leaveApplication;
};

const reviewLeaveApplication = async (accessContext, leaveApplicationId, reviewLeaveApplicationRequestBody)  => {
  //First check leave application with passes id exist or not
  const leaveApplication = await LeaveApplicationRepository.findLeaveApplicationById(leaveApplicationId, accessContext.loggedInAdminHostelId);
  if(!leaveApplication) throw createHttpError(404, `Leave application with id ${id} is not found`, {errors: "Invalid leave application id"});

  if(leaveApplication.status !== "WAITING_FOR_APPROVAL") throw createHttpError(409, "Leave application is not in pending or waiting_for_approval state, so can't review it, currently its "+leaveApplication.status, {errors: "Invalid leave applicaiton review"});

  const { status, rejectionReason } = reviewLeaveApplicationRequestBody;
  
  if(status === "REJECTED" && !rejectionReason) throw createHttpError(422, "Rejection reason is required when rejecting a leave application", {errors: "Missing fields"});

  const reviewedLeaveApplication = await LeaveApplicationRepository.reviewLeaveApplication(leaveApplicationId, status, rejectionReason);
  return reviewedLeaveApplication;
};

const cancelLeaveApplication = async (accessContext, leaveApplicationId) => {
  //first check its present or not
  const leaveApplication = await LeaveApplicationRepository.findLeaveApplicationById(leaveApplicationId, accessContext.loggedInStudentHostelId);
  if(!leaveApplication) throw createHttpError(404, `Leave application with id ${leaveApplicationId} is not found`, {errors: "Invalid id"});

  if(leaveApplication.status !== "WAITING_FOR_APPROVAL") throw createHttpError(409, `Leave application with pending/waiting status only can be cancelled, currently its ${leaveApplication.status}`, {errors: "Cannot cancel because its already "+leaveApplication.status});

  const cancelledLeaveApplication = await LeaveApplicationRepository.cancelLeaveApplication(leaveApplicationId, accessContext.loggedInStudentProfileId);
  return cancelledLeaveApplication;
};

const LeaveApplicationService = {
  createLeaveApplication,
  updateLeaveApplication,
  getAllLeaveApplications,
  getOneLeaveApplication,
  reviewLeaveApplication,
  cancelLeaveApplication,
};

export default LeaveApplicationService;