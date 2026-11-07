import { prisma } from "../../configs/db.js";

const createAnnouncement = async (announcementData) => {
  const announcement = await prisma.announcement.create({
    data: announcementData,
  });

  return announcement;
};

//extraWhere: e.g. only live announcements for students
const getAnnouncementById = async (id, hostelId, extraWhere = {}) => {
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: Number(id),
      hostelId,
      ...extraWhere
    },
  });

  return announcement;
};

const updateAnnouncement = async (id, announcementData) => {
  const announcement = await prisma.announcement.update({
    where: {
      id: Number(id),
    },
    data: announcementData,
  });

  return announcement;
};

const deleteAnnouncement = async (id) => {
  const announcement = await prisma.announcement.delete({
    where: {
      id: Number(id),
    },
  });

  return announcement;
};

const getAnnouncements = async (announcementsWhere, skip, take, orderBy = [{ startDate: "desc" }, { id: "desc" }]) => {
  const announcements = await prisma.announcement.findMany({
    where: announcementsWhere,
    orderBy,
    skip, take
  });

  const totalAnnouncementsCount = await prisma.announcement.count({
    where: announcementsWhere
  });

  return {announcements, totalAnnouncementsCount};
};

const AnnouncementRepository = {
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
};

export default AnnouncementRepository;