import AnnouncementService from "./announcement.service.js";

const createAnnouncement = async (req, res) => {
  const announcement = await AnnouncementService.createAnnouncement(req.body);

  res.status(201).json(announcement);
};

const getAnnouncements = async (req, res) => {
  const announcements = await AnnouncementService.getAnnouncements();

  res.status(200).json(announcements);
};

const getAnnouncementById = async (req, res) => {
  const id = Number(req.params.id);

  const announcement = await AnnouncementService.getAnnouncementById(id);

  res.status(200).json(announcement);
};

const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  const announcement = await AnnouncementService.updateAnnouncement(
    id,
    req.body
  );

  res.status(200).json(announcement);
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