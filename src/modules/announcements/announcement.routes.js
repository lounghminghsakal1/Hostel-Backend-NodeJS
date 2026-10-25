import express from "express";
import AnnouncementController from "./announcement.controller.js";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createAnnouncementRequestBodySchema, getAnnouncementRequestQuerySchema, updateAnnouncementRequestBodySchema } from "./announcement.request-schema.js";

const router = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";
const studentRole = "STUDENT";

router.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createAnnouncementRequestBodySchema}), AnnouncementController.createAnnouncement);

router.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({query: getAnnouncementRequestQuerySchema}) ,AnnouncementController.getAnnouncements);

router.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), AnnouncementController.getAnnouncementById);

router.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateAnnouncementRequestBodySchema}) ,AnnouncementController.updateAnnouncement);


// router.delete("/:id", AnnouncementController.deleteAnnouncement);

export default router;