import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createRoomRequestBodySchema, updateRoomRequestBodySchema } from "./room.request-schema.js";
import RoomsController from "./room.controller.js";

const roomsRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

roomsRouter.post("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createRoomRequestBodySchema}), RoomsController.createRoom);

roomsRouter.get("/", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), RoomsController.getRooms);

roomsRouter.get("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), RoomsController.getOneRoom)

roomsRouter.patch("/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateRoomRequestBodySchema}), RoomsController.updateRoom);

export default roomsRouter;