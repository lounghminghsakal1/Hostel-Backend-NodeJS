import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import UpcomingEventsService from "./upcoming-event.service.js";

const createUpcomingEvent = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdUpcomingEvent = await UpcomingEventsService.createUpcomingEvent(accessContext, req.body);
  return Responses.successResponse(res, "Upcoming event created successfully", createdUpcomingEvent, 201);
};

const updateUpcomingEvent = async (req, res) => {
  const upcomingEventId = Number(req.params.id);
  const accessContext = getAccessContext(req);
  const updatedUpcomingEvent = await UpcomingEventsService.updateUpcomingEvent(accessContext, upcomingEventId, req.body);
  return Responses.successResponse(res, "Upcoming event updated", updatedUpcomingEvent);
};

const getAllUpcomingEvents = async (req, res) => {
  const accessContext = getAccessContext(req);
  const {allUpcomingEvents, paginationMeta} = await UpcomingEventsService.getAllUpcomingEvents(accessContext, req.validatedQuery);
  return Responses.paginatedResponse(res, "All upcoming events fetched successfully", allUpcomingEvents, paginationMeta);
};

const getOneUpcomingEvent = async (req, res) => {
  const accessContext = getAccessContext(req);
  const upcomingEventId = Number(req.params.id);
  const upcomingEvent = await UpcomingEventsService.getOneUpcomingEvent(accessContext, upcomingEventId);
  return Responses.successResponse(res, "Upcoming event fetched successfully", upcomingEvent);
};

const UpcomingEventsController = {
  createUpcomingEvent,
  updateUpcomingEvent,
  getAllUpcomingEvents,
  getOneUpcomingEvent
};

export default UpcomingEventsController;