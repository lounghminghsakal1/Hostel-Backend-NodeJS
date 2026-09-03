import express from "express";
import AuthController from "./auth.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { loginRequestBodySchema } from "./auth.request-schema.js";

const authRouter = express.Router();

authRouter.post("/login", validateRequestMiddleware({body: loginRequestBodySchema}), AuthController.authLogin);

export default authRouter;