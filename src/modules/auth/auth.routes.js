import express from "express";
import AuthController from "./auth.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { loginRequestSchema } from "./auth.request-schema.js";

const authRouter = express.Router();

authRouter.post("/login", validateRequestMiddleware(loginRequestSchema), AuthController.authLogin);

export default authRouter;