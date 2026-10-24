import createHttpError from "http-errors";
import RoomsRepository from "./room.repository.js";
import { buildMeta, toPrismaPagination } from "../../utils/pagination.utils.js";
import { skip } from "@prisma/client/runtime/client";

const createRoom = async (accessContext, roomNumber, capacity) => {
  // room number must be unique within that hostel, so checking it now
  const existingRoomWithThisRoomNumber = await RoomsRepository.findRoomByRoomNumberWithinHostel(accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId, roomNumber);
  if (existingRoomWithThisRoomNumber) throw createHttpError(409, "Room number already exists in your hostel", { errors: "Invalid room number" });

  const createdRoom = await RoomsRepository.createRoom(accessContext.loggedInAdminHostelId, roomNumber, capacity);
  return createdRoom;
};

const getRooms = async (accessContext, getRoomQuery) => {
  const {
    starts_with,
    only_vacancy = false,
    by_student_name,
    by_student_roll_number,
    page,
    pageSize
  } = getRoomQuery;

  const roomWhere = { hostelId: accessContext.loggedInAdminHostelId };
  if (starts_with?.trim()) roomWhere.roomNumber = { startsWith: starts_with.trim(), mode: "insensitive" };

  let studentWhere = {};
  if(by_student_name?.trim()) {
    studentWhere.studentName = {
      contains: by_student_name.trim(),
      mode: "insensitive"
    }
  }
  if(by_student_roll_number?.trim()) {
    studentWhere.rollNumber = by_student_roll_number.trim()
  }

  if(Object.keys(studentWhere).length > 0) {
    roomWhere.studentProfiles = {
      some: studentWhere
    }
  }

  const prismaPagination = toPrismaPagination(page, pageSize);

  //user (currently hostel admin) can see only his hostel room only
  const rooms = await RoomsRepository.getRooms(roomWhere);  ;
  const roomsResponseData = [];
  rooms.forEach(room => {
    const roomObj = { ...room };
    roomObj.occupied = room._count.studentProfiles;
    roomObj.remaining = room.capacity - room._count.studentProfiles;
    delete roomObj._count;
    if (only_vacancy) {
      if (roomObj.remaining > 0) {
        roomsResponseData.push(roomObj);
        return;
      }
    } else {
      roomsResponseData.push(roomObj);
    }
  });

  const paginationMeta = buildMeta(page, pageSize, roomsResponseData.length);

  return {rooms: roomsResponseData.slice(prismaPagination.skip, prismaPagination.skip + prismaPagination.take), paginationMeta: paginationMeta};
};

const getOneRoom = async (roomId, accessContext) => {
  const room = await RoomsRepository.findRoomById(roomId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!room) throw createHttpError(404, "Room not found with id " + roomId, { errors: "Invalid room id" });
  return room;
};

const updateRoom = async (accessContext, roomId, updateRoomRequestBody) => {
  //check room with passed id present or not - also scope
  const room = await RoomsRepository.findRoomById(roomId, accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!room) throw createHttpError(404, `Room with id ${roomId} not found`, { errors: "Invalid room id" });

  if (updateRoomRequestBody.roomNumber) {
    //check this passed room number (new room number) is unique within the hostel or not
    const existingRoomWithThisRoomNumber = await RoomsRepository.findRoomByRoomNumberWithinHostel(accessContext.loggedInAdminHostelId, accessContext.loggedInAdminCollegeId, updateRoomRequestBody.roomNumber, roomId);
    if (existingRoomWithThisRoomNumber) throw createHttpError(409, `Room with this room number is already exists`, { errors: "Invalid room number" });
  }


  if (updateRoomRequestBody.capacity) {
    //passed capacity is same or not
    // if (room.capacity === updateRoomRequestBody.capacity) throw createHttpError(409, "Room has already the capacity as " + room.capacity, { errors: "Invalid room capacity" });

    // if suppose user reducing capacity for the room(from 5 to 3) and that room has already has few students lets say (4) then it would be conflict so
    if (room._count.studentProfiles > updateRoomRequestBody.capacity) throw createHttpError(409, `The room has already ${room._count.studentProfiles} students so cannot reduce capacity beyond that`);
  }

  const updatedRoom = await RoomsRepository.updateRoom(roomId, updateRoomRequestBody.roomNumber, updateRoomRequestBody.capacity);
  return updatedRoom;
};

const RoomsService = {
  createRoom,
  getRooms,
  getOneRoom,
  updateRoom
};

export default RoomsService;