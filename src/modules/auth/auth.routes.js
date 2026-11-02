import express from "express";
import AuthController from "./auth.controller.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { loginRequestBodySchema } from "./auth.request-schema.js";
import z from "zod";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", validateRequestMiddleware({body: loginRequestBodySchema}), AuthController.authLogin);

authRouter.post("/refresh", validateRequestMiddleware({body: z.object({refreshToken: z.string()})}), AuthController.refreshTokens);

authRouter.post("/logout", authenticateUserMiddleware, validateRequestMiddleware({body: z.object( {refreshToken: z.string()})}), AuthController.logout);

export default authRouter;


// API	     Purpose	        Priority
// POST      /login	       Authenticate and create session	Required
// POST      /refresh	     Rotate tokens	Required
// POST      /logout	     Revoke current session	Required
// GET       /me	         Get currently authenticated user	Useful
// POST      /logout-all	 Revoke all sessions	Later
// GET       /sessions	   List logged-in devices	Later
// DELETE    /sessions/:id Revoke a particular device	Later