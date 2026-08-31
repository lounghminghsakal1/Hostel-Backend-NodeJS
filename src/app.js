import express from "express";
import startServerAndConnectDB from "./server.js";
import authRouter from "./modules/auth/auth.routes.js";
import gloabalErrorHandlerMiddleware from "./middlewares/global-error-handler.middleware.js";
import envValues from "./configs/envFile.js";
import hostelAdminRouter from "./modules/hostel-admins/hostel-admins.routes.js";
import studentRouter from "./modules/students/student.routes.js";
import hostelRouter from "./modules/hostels/hostel.routes.js";
import roomsRouter from "./modules/rooms/room.routes.js";
import leaveApplicationRouter from "./modules/leave-applications/leave-appln.routes.js";
import uploadRouter from "./modules/upload/upload.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const prefix_api = envValues.API_PREFIX;

app.use(express.json());

app.use(`${prefix_api}/auth`, authRouter);

app.use(`${prefix_api}/hostel_admins`, hostelAdminRouter);

app.use(`${prefix_api}/students`, studentRouter);

app.use(`${prefix_api}/hostels`, hostelRouter);

app.use(`${prefix_api}/rooms`, roomsRouter);

app.use(`${prefix_api}/leave_applications`, leaveApplicationRouter);

app.use(`${prefix_api}/upload`, uploadRouter);

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

app.use("/uploaded-files", express.static(path.join(__dirName, "../uploaded-files")));

app.use(gloabalErrorHandlerMiddleware);


await startServerAndConnectDB(app);
