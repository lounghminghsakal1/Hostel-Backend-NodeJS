import createHttpError from "http-errors";
import AnnouncementRepository from "./announcement.repository.js";

const createAnnouncement = async (accessContext, announcementData) => {

  const announcement =
    await AnnouncementRepository.createAnnouncement({...announcementData, hostelId: accessContext.loggedInAdminHostelId});

  return announcement;
};

const getAnnouncements = async (accessContext) => {
  const announcements =
    await AnnouncementRepository.getAnnouncements(accessContext.loggedInAdminHostelId);

  return announcements;
};

const getAnnouncementById = async (id, hostelId) => {
  const announcement =
    await AnnouncementRepository.getAnnouncementById(id, hostelId);

  if (!announcement) {
    throw createHttpError(
      404,
      `Announcement with id ${id} not found`,
      { errors: "Invalid request" }
    );
  }

  return announcement;
};

const updateAnnouncement = async (accessContext, id, announcementData) => {
  const announcement = await AnnouncementRepository.getAnnouncementById(id, accessContext.loggedInAdminHostelId);  
  if (!announcement) {
    throw createHttpError(
      404,
      `Announcement with id ${id} not found`,
      { errors: "Invalid request" }
    );
  }

  const updatedAnnouncement =
    await AnnouncementRepository.updateAnnouncement(
      id,
      announcementData
    );


  return updatedAnnouncement;
};

const deleteAnnouncement = async (id) => {
  const announcement =
    await AnnouncementRepository.deleteAnnouncement(id);

  if (!announcement) {
    throw createHttpError(
      404,
      `Announcement with id ${id} not found`,
      { errors: "Invalid request" }
    );
  }

  return announcement;
};

const AnnouncementService = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};

export default AnnouncementService;