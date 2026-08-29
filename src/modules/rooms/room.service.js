import createHttpError from "http-errors";
import RoomsRepository from "./room.repository.js";

const createRoom = async (accessContext, roomNumber, capacity) => {
  // room number must be unique within that hostel, so checking it now
  const existingRoomWithThisRoomNumber = await RoomsRepository.findRoomByRoomNumberWithinHostel(accessContext.loggedAdminHostelId, accessContext.loggedInAdminCollegeId, roomNumber);
  if (existingRoomWithThisRoomNumber) throw createHttpError(409, "Room number already exists in your hostel", { errors: "Invalid room number" });

  const createdRoom = await RoomsRepository.createRoom(accessContext.loggedAdminHostelId, roomNumber, capacity);
  return createdRoom;
};

const getRooms = async (accessContext) => {
  //user (currently hostel admin) can see only his hostel room only
  return await RoomsRepository.getRooms(accessContext.loggedAdminHostelId, accessContext.loggedInAdminCollegeId);
};

const getOneRoom = async (roomId, accessContext) => {
  const room = await RoomsRepository.findRoomById(roomId, accessContext.loggedAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!room) throw createHttpError(404, "Room not found with id " + roomId, { errors: "Invalid room id" });
  return room;
};

const updateRoom = async (accessContext, roomId, updateRoomRequestBody) => {
  //check room with passed id present or not - also scope
  const room = await RoomsRepository.findRoomById(roomId, accessContext.loggedAdminHostelId, accessContext.loggedInAdminCollegeId);
  if (!room) throw createHttpError(404, `Room with id ${roomId} not found`, { errors: "Invalid room id" });

  if (updateRoomRequestBody.roomNumber) {
    //check this passed room number (new room number) is unique within the hostel or not
    const existingRoomWithThisRoomNumber = await RoomsRepository.findRoomByRoomNumberWithinHostel(accessContext.loggedAdminHostelId, accessContext.loggedInAdminCollegeId, updateRoomRequestBody.roomNumber, roomId);
    if (existingRoomWithThisRoomNumber) throw createHttpError(409, `Room with this room number is already exists`, { errors: "Invalid room number" });
  }

  
  if (updateRoomRequestBody.capacity) {
    //passed capacity is same or not
    if (room.capacity === updateRoomRequestBody.capacity) throw createHttpError(409, "Room has already the capacity as " + room.capacity, { errors: "Invalid room capacity" });

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