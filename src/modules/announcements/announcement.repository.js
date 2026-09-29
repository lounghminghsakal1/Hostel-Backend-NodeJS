import { prisma } from "../../configs/db.js";

const createAnnouncement = async (announcementData) => {
  return await prisma.announcement.create({
    data: announcementData
  });
};

const getAnnouncements = async () => {
  return await prisma.announcement.findMany({
    orderBy: {
      priority: "asc"
    }
  });
};

const getAnnouncementById = async (id) => {
  return await prisma.announcement.findUnique({
    where: {
      id
    }
  });
};

const updateAnnouncement = async (id, announcementData) => {
  return await prisma.announcement.update({
    where: {
      id
    },
    data: announcementData
  });
};

const deleteAnnouncement = async (id) => {
  return await prisma.announcement.delete({
    where: {
      id
    }
  });
};

const AnnouncementRepository = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};

export default AnnouncementRepository;