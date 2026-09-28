import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createUpcomingEventRequestBodySchema, updateUpcomingEventRequestBodySchema } from "./upcoming-event.request-schema.js";
import UpcomingEventsController from "./upcoming-event.controller.js";

const upcomingEventsRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

const studentRole = "STUDENT";

upcomingEventsRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createUpcomingEventRequestBodySchema}), UpcomingEventsController.createUpcomingEvent);

upcomingEventsRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateUpcomingEventRequestBodySchema}), UpcomingEventsController.updateUpcomingEvent);

upcomingEventsRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole, studentRole), UpcomingEventsController.getAllUpcomingEvents);

upcomingEventsRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole, studentRole), UpcomingEventsController.getOneUpcomingEvent);

export default upcomingEventsRouter;