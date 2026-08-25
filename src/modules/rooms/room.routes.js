import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createRoomRequestSchema, updateRoomRequestSchema } from "./room.request-schema.js";
import RoomsController from "./room.controller.js";

const roomsRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

roomsRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(createRoomRequestSchema), RoomsController.createRoom);

roomsRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), RoomsController.getRooms);

roomsRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), RoomsController.getOneRoom)

roomsRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware(updateRoomRequestSchema), RoomsController.updateRoom);

export default roomsRouter;