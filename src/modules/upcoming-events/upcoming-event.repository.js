import { prisma } from "../../configs/db.js";

const createUpcomingEvent = async (eventName, eventDescription, startingAt, endingAt, eventImageKey, eventLink, contactPersonName, contactPersonPhone, hostelId) => {
  return await prisma.upcomingEvent.create({
    data: {
      eventName,
      eventDescription,
      startingAt,
      endingAt,
      eventImageKey: eventImageKey ?? undefined,
      eventLink: eventLink ?? undefined,
      contactPersonName: contactPersonName ?? undefined,
      contactPersonPhone: contactPersonPhone ?? undefined,
      hostelId
    }
  });
};

const findUpcomingEventById = async (id) => {
  return await prisma.upcomingEvent.findUnique({
    where: {
      id
    }
  });
}; 

const updateUpcomingEvent = async (id, eventName, eventDescription, startingAt, endingAt, eventImageKey, eventLink, contactPersonName, contactPersonPhone, isActive, hostelId) => {
  return await prisma.upcomingEvent.update({
    where: {
      id
    },
    data: {
      eventName: eventName ?? undefined,
      eventDescription: eventDescription ?? undefined,
      startingAt: startingAt ?? undefined,
      endingAt: endingAt ?? undefined,
      isActive: isActive ?? undefined,
      eventImageKey: eventImageKey ?? undefined,
      eventLink: eventLink ?? undefined,
      contactPersonName: contactPersonName ?? undefined,
      contactPersonPhone: contactPersonPhone ?? undefined
    }
  });
};

const getAllUpcomingEvents = async (hostelId) => {
  return await prisma.upcomingEvent.findMany({
    where: {
      hostelId: hostelId
    }
  });
};

const UpcomingEventsRepository = {
  createUpcomingEvent,
  findUpcomingEventById,
  updateUpcomingEvent,
  getAllUpcomingEvents
};

export default UpcomingEventsRepository;