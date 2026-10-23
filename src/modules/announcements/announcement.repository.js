import { prisma } from "../../configs/db.js";

const createAnnouncement = async (announcementData) => {
  const announcement = await prisma.announcement.create({
    data: announcementData,
  });

  return announcement;
};

const getAnnouncementById = async (id, hostelId) => {
  const announcement = await prisma.announcement.findUnique({
    where: {
      id: Number(id),
      hostelId
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

const getAnnouncements = async (hostelId) => {
  const announcements = await prisma.announcement.findMany({
    where: {
      hostelId
    },
  });

  return announcements;
};

const AnnouncementRepository = {
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
};

export default AnnouncementRepository;