import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import RoomsService from "./room.service.js";

const createRoom = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdRoom = await RoomsService.createRoom(accessContext, req.body.roomNumber, req.body.capacity);
  return Responses.successResponse(res, "Room created successfully", createdRoom, 201);
};

const getRooms = async (req, res) => {
  const accessContext = getAccessContext(req);
  const allRooms = await RoomsService.getRooms(accessContext);
  Responses.successResponse(res, "All rooms fetched successfully", allRooms);
};

const getOneRoom = async (req, res) => {
  const accessContext = getAccessContext(req);
  const room = await RoomsService.getOneRoom(Number(req.params.id), accessContext);
  return Responses.successResponse(res, "Room fetched successfully", room);
};

const updateRoom = async (req, res) => {
  const accessContext = getAccessContext(req);
  const updatedRoom = await RoomsService.updateRoom(accessContext, Number(req.params.id), req.body);
  return Responses.successResponse(res, "Room updated successfully", updatedRoom);
};

const RoomsController = {
  createRoom,
  getRooms,
  getOneRoom,
  updateRoom
};

export default RoomsController;