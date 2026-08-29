import { prisma } from "../../configs/db.js";

const findRoomByRoomNumberWithinHostel = async (hostelId, collegeId, roomNumber) => {
  const room = await prisma.room.findFirst({
    where: {
      hostelId: hostelId,
      roomNumber: roomNumber
    }
  });
  return room;
};

const createRoom = async (hostelId, roomNumber, capacity) => {
  const createdRoom = await prisma.room.create({
    data: {
      roomNumber: roomNumber,
      capacity: capacity,
      hostelId: hostelId
    }
  });
  return createdRoom;
};

const getRooms = async (hostelId, collegeId) => {
  return await prisma.room.findMany({
    where: {
      hostelId: hostelId,
    }
  });
};

const findRoomById = async (id, hostelId, collegeId) => {
  return await prisma.room.findFirst({
    where: {
      id: id,
      hostelId,
    },
    select: {
      id: true,
      roomNumber: true,
      capacity: true,
      hostelId: true,
      _count: {
        select: {
          studentProfiles: true
        }
      }
    }
  });
};

const updateRoom = async (id, roomNumber, capacity) => {
  return await prisma.room.update({
    where: {
      id: id
    },
    data: {
      roomNumber: roomNumber ?? undefined,
      capacity: capacity ?? undefined
    }
  });
};

const RoomsRepository = {
  findRoomByRoomNumberWithinHostel,
  createRoom,
  getRooms,
  findRoomById,
  updateRoom
};

export default RoomsRepository;