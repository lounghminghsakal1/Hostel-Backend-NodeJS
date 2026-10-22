import createHttpError from "http-errors";
import UpcomingEventsRepository from "./upcoming-event.repository.js";

const createUpcomingEvent = async (accessContext, createUpcomingEventRequestBody) => {
  const {
    eventName,
    eventDescription,
    startingAt,
    endingAt,
    eventImageKey,
    eventLink,
    contactPersonName,
    contactPersonPhone 
  } = createUpcomingEventRequestBody;

  const hostelId = accessContext.loggedInAdminHostelId;
  const createdUpcomingEvent = await UpcomingEventsRepository.createUpcomingEvent(eventName, eventDescription, startingAt, endingAt, eventImageKey, eventLink, contactPersonName, contactPersonPhone, hostelId);

  return createdUpcomingEvent;
};

const updateUpcomingEvent = async (accessContext, id, updateUpcomingEventRequestBody) => {
  const upcomingEvent = await UpcomingEventsRepository.findUpcomingEventById(id);
  if(!upcomingEvent) throw createHttpError(404, "Upcoming event with id "+id+" not found", {errors: "Invalid id"});
  
  const {
    eventName,
    eventDescription,
    startingAt,
    endingAt,
    eventImageKey,
    eventLink,
    contactPersonName,
    contactPersonPhone,
    isActive 
  } = updateUpcomingEventRequestBody;

  const hostelId = accessContext.loggedInAdminHostelId;

  const updatedUpcomingEvent = await UpcomingEventsRepository.updateUpcomingEvent(id, eventName, eventDescription, startingAt, endingAt, eventImageKey, eventLink, contactPersonName, contactPersonPhone, isActive, hostelId);

  return updatedUpcomingEvent;
};

const getAllUpcomingEvents = async (accessContext) => {
  const hostelId = accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId;
  return await UpcomingEventsRepository.getAllUpcomingEvents(hostelId);
};

const getOneUpcomingEvent = async (accessContext, id) => {
  const upcomingEvent = await UpcomingEventsRepository.findUpcomingEventById(id);
  if(!upcomingEvent) throw createHttpError(404, "Upcoming event with id "+id+" not found", {errors: "Invalid id"});
  return upcomingEvent;
};

const UpcomingEventsService = {
  createUpcomingEvent,
  updateUpcomingEvent,
  getAllUpcomingEvents,
  getOneUpcomingEvent,
};

export default UpcomingEventsService;