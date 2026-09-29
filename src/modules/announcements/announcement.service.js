import AnnouncementRepository from "./announcement.repository.js";
import createHttpError from "http-errors";

const createAnnouncement = async (announcementData) => {
  const announcement = await AnnouncementRepository.createAnnouncement(announcementData);
  return announcement;

};
const getAnnouncements = async () => {
    const announcements = await AnnouncementRepository.getAnnouncements();
    return announcements;
};
const getAnnouncementById = async (id) => {
    const announcement = await AnnouncementRepository.getAnnouncementById(id);
    if (!announcement) throw createHttpError(404, `Announcement with id ${id} not found`, { errors: "Invalid request" });
    return announcement;
}
const updateAnnouncement = async (id, announcementData) => {
    const announcement = await AnnouncementRepository.updateAnnouncement(id, announcementData);
    if (!announcement) throw createHttpError(404, `Announcement with id ${id} not found`, { errors: "Invalid request" });
    return announcement;
}

const announcementService = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement
};
export default announcementService;