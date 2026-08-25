import Responses from "../../utils/responses.utils.js";
import RoomsService from "./room.service.js";

const createRoom = async (req, res) => {
  const createdRoom = await RoomsService.createRoom(req.user.hostelAdminProfile.hostelId, req.body.roomNumber, req.body.capacity);
  return Responses.successResponse(res, "Room created successfully", createdRoom, 201);
};

const getRooms = async (req, res) => {
  const allRooms = await RoomsService.getRooms(req.user.hostelAdminProfile.hostelId);
  Responses.successResponse(res, "All rooms fetched successfully", allRooms);
};

const getOneRoom = async (req, res) => {
  const room = await RoomsService.getOneRoom(Number(req.params.id));
  return Responses.successResponse(res, "Room fetched successfully", room);
};

const updateRoom = async (req, res) => {
  const updatedRoom = await RoomsService.updateRoom(req.user.hostelAdminProfile.hostelId, Number(req.params.id), req.body);
  return Responses.successResponse(res, "Room updated successfully", updatedRoom);
};

const RoomsController = {
  createRoom,
  getRooms,
  getOneRoom,
  updateRoom
};

export default RoomsController;