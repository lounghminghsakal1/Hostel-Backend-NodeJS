import { prisma } from "../../configs/db.js";

const findRoomByRoomNumberWithinHostel = async (hostelId, roomNumber) => {
  const room = await prisma.room.findUnique({
    where: {
      hostelId_roomNumber: {
        hostelId: hostelId,
        roomNumber: roomNumber
      }
    }
  });
  return room;
};

const createRoom = async(hostelId, roomNumber, capacity) => {
  const createdRoom = await prisma.room.create({
    data: {
      roomNumber: roomNumber,
      capacity: capacity,
      hostelId: hostelId
    }
  });
  return createdRoom;
};

const getRooms = async (hostelId) => {
  return await prisma.room.findMany({
    where: {
      hostelId: hostelId
    } 
  });
};

const findRoomById = async (id) => {
  return await prisma.room.findUnique({
    where: {
      id: id
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