import createHttpError from "http-errors";
import UpcomingEventsRepository from "./upcoming-event.repository.js";
import { getDateRange } from "../../utils/dates.utils.js";
import { isStudentRequest, visibleEventWhere } from "../../utils/notice-visibility.utils.js";
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

  if (startingAt >= endingAt) throw createHttpError(422, "The event must end after it starts", { errors: "Invalid date range" });

  const hostelId = accessContext.loggedInAdminHostelId;
  const createdUpcomingEvent = await UpcomingEventsRepository.createUpcomingEvent(eventName, eventDescription, startingAt, endingAt, eventImageKey, eventLink, contactPersonName, contactPersonPhone, hostelId);

  return createdUpcomingEvent;
};

const updateUpcomingEvent = async (accessContext, id, updateUpcomingEventRequestBody) => {
  const upcomingEvent = await UpcomingEventsRepository.findUpcomingEventById(id, accessContext.loggedInAdminHostelId);
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

  if (startingAt > endingAt) throw createHttpError(422, "Starting at must be before than ending at", { errors: "Invalid date range" });

  const nextStartingAt =
    startingAt ?? upcomingEvent.startingAt;

  const nextEndingAt =
    endingAt ?? upcomingEvent.endingAt;

  if (nextStartingAt > nextEndingAt) {
    throw createHttpError(
      422,
      "startingAt must be before or equal to endingAt",
      { errors: "Invalid event date range" }
    );
  }

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
  if (is_active !== undefined) {
    upcomingEventsWhere.isActive = is_active;
  }
  if (to_date && !from_date) throw createHttpError(422, "Provide both date filters or from date only which takes to date as today", { errors: "Invalid date filter query params" });

  if (from_date) {
    const { startDate, endDate } = getDateRange(from_date, to_date);
    upcomingEventsWhere.startingAt = {
      gte: startDate
    }
    upcomingEventsWhere.endingAt = {
      lte: endDate
    }
  }

  //students only see events that are switched on and haven't ended (happening now or coming up), soonest first;
  //admins see everything, newest first
  const forStudent = isStudentRequest(accessContext);
  if (forStudent) Object.assign(upcomingEventsWhere, visibleEventWhere());
  const orderBy = forStudent
    ? [{ startingAt: "asc" }, { id: "asc" }]
    : [{ startingAt: "desc" }, { id: "desc" }];

  const prismaPagination = toPrismaPagination(page, pageSize);
  const [allUpcomingEvents, totalCount] = await Promise.all([UpcomingEventsRepository.getAllUpcomingEvents(upcomingEventsWhere, prismaPagination.skip, prismaPagination.take, orderBy), UpcomingEventsRepository.getTotoalOfUpcomingEvents(upcomingEventsWhere)]);

  const paginationMeta = buildMeta(page, pageSize, totalCount);

  return { allUpcomingEvents, paginationMeta };
};

const getOneUpcomingEvent = async (accessContext, id) => {
  const hostelId = accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId;
  const upcomingEvent = await UpcomingEventsRepository.findUpcomingEventById(id, hostelId);
  if (!upcomingEvent) throw createHttpError(404, "Upcoming event with id " + id + " not found", { errors: "Invalid id" });
  //students can't open hidden or finished events
  if (isStudentRequest(accessContext) && (!upcomingEvent.isActive || upcomingEvent.endingAt <= new Date())) {
    throw createHttpError(404, "This event is no longer available", { errors: "Event not visible" });
  }
  return upcomingEvent;
};

const UpcomingEventsService = {
  createUpcomingEvent,
  updateUpcomingEvent,
  getAllUpcomingEvents,
  getOneUpcomingEvent,
};

export default UpcomingEventsService;