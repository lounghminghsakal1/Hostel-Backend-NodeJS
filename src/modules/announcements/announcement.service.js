import createHttpError from "http-errors";
import AnnouncementRepository from "./announcement.repository.js";
import { getDateRange } from "../../utils/dates.utils.js";
import { gte, lte } from "zod";
import { buildMeta, toPrismaPagination } from "../../utils/pagination.utils.js";

const createAnnouncement = async (accessContext, announcementData) => {

  const announcement =
    await AnnouncementRepository.createAnnouncement({ ...announcementData, hostelId: accessContext.loggedInAdminHostelId });

  return announcement;
};

const getAnnouncements = async (accessContext, getAnnouncementsQuery) => {
  const {
    by_announcement_title,
    by_status,
    from_date,
    to_date,
    by_announcement_type,
    only_important,
    page, pageSize
  } = getAnnouncementsQuery;

  const announcementsWhere = { hostelId: accessContext.loggedInAdminHostelId };
  if (by_announcement_title?.trim()) announcementsWhere.title = { contains: by_announcement_title.trim(), mode: "insensitive" };
  if (by_status?.trim()) announcementsWhere.status = by_status.trim();
  if (by_announcement_type?.trim()) announcementsWhere.announcementType = by_announcement_type.trim();
  if (only_important) announcementsWhere.isImportant = only_important;
  if (from_date || to_date) {
    if (!from_date || !to_date) {
      throw createHttpError(422, "Both from_date and to_date are required");
    }

    if (from_date > to_date) {
      throw createHttpError(422, "from_date must be on or before to_date");
    }

    announcementsWhere.startDate = { gte: from_date };
    announcementsWhere.endDate = { lte: to_date };
  }

  const prismaPagination = toPrismaPagination(page, pageSize);


  const { announcements, totalAnnouncementsCount } =
    await AnnouncementRepository.getAnnouncements(announcementsWhere, prismaPagination.skip, prismaPagination.take);

  const paginationMeta = buildMeta(page, pageSize, totalAnnouncementsCount);
  return { announcements, paginationMeta };
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
  const nextStart =
    announcementData.startDate ?? announcement.startDate;

  const nextEnd =
    announcementData.endDate ?? announcement.endDate;

  if (nextStart > nextEnd) {
    throw createHttpError(
      422,
      "endDate must be on or after startDate"
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