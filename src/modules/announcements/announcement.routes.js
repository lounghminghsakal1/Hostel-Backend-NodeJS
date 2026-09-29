import express from "express";
import AnnouncementController from "./announcement.controller.js";

const router = express.Router();

router.post("/", AnnouncementController.createAnnouncement);

router.get("/", AnnouncementController.getAnnouncements);

router.get("/:id", AnnouncementController.getAnnouncementById);

router.patch("/:id", AnnouncementController.updateAnnouncement);

router.delete("/:id", AnnouncementController.deleteAnnouncement);

export default router;