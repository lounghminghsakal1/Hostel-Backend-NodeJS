import { prisma } from "../../configs/db.js";

const findRoomByRoomNumberWithinHostel = async (hostelId, collegeId, roomNumber, excludeRoomId) => {
  const room = await prisma.room.findFirst({
    where: {
      hostelId: hostelId,
      roomNumber: roomNumber,
      ...(excludeRoomId !== undefined ? {id: {not: excludeRoomId}} : {})
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

const getRooms = async (roomWhere) => {
  return await prisma.room.findMany({
    where: roomWhere,
    select: {
      id: true,
      roomNumber: true,
      capacity: true,
      _count: {
        select: {
          studentProfiles: true
        }
      }
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
      studentProfiles: {
        select: {
          studentName: true,
          contactNumber: true,
          rollNumber: true,
          department: {
            select: {
              departmentName: true
            }
          }
        }
      },
      _count: {
        select: {
          studentProfiles: true
        }
      }
    },
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

const getTotalCountOfRooms = async (roomWhere) => {
  return await prisma.room.count({
    where: roomWhere
  });
};

const RoomsRepository = {
  findRoomByRoomNumberWithinHostel,
  createRoom,
  getRooms,
  findRoomById,
  updateRoom,
  getTotalCountOfRooms
};

export default RoomsRepository;