import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import AnnouncementService from "./announcement.service.js";

const createAnnouncement = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdAnnouncement = await AnnouncementService.createAnnouncement(accessContext, req.body);

  return Responses.successResponse(res, "Announcement created successfully", createdAnnouncement, 201);
};

const getAnnouncements = async (req, res) => {
  const accessContext = getAccessContext(req);
  const {announcements, paginationMeta} = await AnnouncementService.getAnnouncements(accessContext, req.validatedQuery);

  return Responses.paginatedResponse(res, "All announcements fetched successfully", announcements, paginationMeta);
};

const getAnnouncementById = async (req, res) => {
  const accessContext = getAccessContext(req);
  const id = Number(req.params.id);

  const hostelId = accessContext.loggedInAdminHostelId ?? accessContext.loggedInStudentHostelId;
  const announcement = await AnnouncementService.getAnnouncementById(id, hostelId);

  return Responses.successResponse(res, "Announcement fetched successfully", announcement);
};

const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id);
  const accessContext = getAccessContext(req);
  const updatedAnnouncement = await AnnouncementService.updateAnnouncement(
    accessContext,
    id,
    req.body
  );

  return Responses.successResponse(res, "Announcement updated successfully", updatedAnnouncement);
};

const deleteAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  const announcement = await AnnouncementService.deleteAnnouncement(id);

  res.status(200).json(announcement);
};

const AnnouncementController = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};

export default AnnouncementController;