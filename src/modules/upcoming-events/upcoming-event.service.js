import createHttpError from "http-errors";
import UpcomingEventsRepository from "./upcoming-event.repository.js";
import { getDateRange } from "../../utils/dates.utils.js";
import { gte, lte } from "zod";
import { buildMeta, toPrismaPagination } from "../../utils/pagination.utils.js";

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
  if (!upcomingEvent) throw createHttpError(404, "Upcoming event with id " + id + " not found", { errors: "Invalid id" });

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

const getAllUpcomingEvents = async (accessContext, getUpcomingEventsQuery) => {
  const {
    by_event_name,
    from_date,
    to_date,
    is_active,
    page, pageSize
  } = getUpcomingEventsQuery;

  let upcomingEventsWhere = { hostelId: accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId };
  if (by_event_name?.trim()) {
    upcomingEventsWhere.eventName = {
      contains: by_event_name.trim(),
      mode: "insensitive"
    }
  }
  if (is_active) upcomingEventsWhere.isActive = is_active;
  if (from_date || to_date) {
    const { startDate, endDate } = getDateRange(from_date, to_date);
    upcomingEventsWhere.startingAt = {
      gte: startDate
    }
    upcomingEventsWhere.endingAt = {
      lte: endDate
    }
  }

  const prismaPagination = toPrismaPagination(page, pageSize);
  // const hostelId = accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId;
  const [allUpcomingEvents, totalCount] =  await Promise.all([UpcomingEventsRepository.getAllUpcomingEvents(upcomingEventsWhere, prismaPagination.skip, prismaPagination.take), UpcomingEventsRepository.getTotoalOfUpcomingEvents(upcomingEventsWhere)]);

  const paginationMeta = buildMeta(page, pageSize, totalCount);

  return {allUpcomingEvents, paginationMeta};
};

const getOneUpcomingEvent = async (accessContext, id) => {
  const upcomingEvent = await UpcomingEventsRepository.findUpcomingEventById(id);
  if (!upcomingEvent) throw createHttpError(404, "Upcoming event with id " + id + " not found", { errors: "Invalid id" });
  return upcomingEvent;
};

const UpcomingEventsService = {
  createUpcomingEvent,
  updateUpcomingEvent,
  getAllUpcomingEvents,
  getOneUpcomingEvent,
};

export default UpcomingEventsService;