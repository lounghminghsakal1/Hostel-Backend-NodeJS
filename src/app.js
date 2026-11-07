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
import UploadDownloadRouter from "./modules/upload-download/upload-download.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import attendanceRecordsRouter from "./modules/attendance-records/attndr.routes.js";
import upcomingEventsRouter from "./modules/upcoming-events/upcoming-events.routes.js";
import MessFeeRouter from "./modules/mess-fees/mess-fee.routes.js";
import cors from "cors";
import announcementRouter from "./modules/announcements/announcement.routes.js";
import appLinksRouter from "./modules/app-links/app-links.routes.js";
import healthRouter from "./modules/health/health.routes.js";
import websiteRouter from "./modules/website/website.routes.js";

const app = express();

const prefix_api = envValues.API_PREFIX;

app.use(express.json());

//web frontends allowed to call the API: CORS_ORIGINS in .env, comma separated (mobile apps don't need CORS)
//e.g. CORS_ORIGINS=https://staging.ourhostel.in,http://localhost:3000
const allowedOrigins = envValues.CORS_ORIGINS
  ? envValues.CORS_ORIGINS.split(",").map(origin => origin.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({
  origin: allowedOrigins
}));

//every API endpoint shared by the mobile app and the website, mounted under each client's namespace below
const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/hostel_admin", hostelAdminRouter);
apiRouter.use("/students", studentRouter);
apiRouter.use("/hostels", hostelRouter);
apiRouter.use("/rooms", roomsRouter);
apiRouter.use("/leave_applications", leaveApplicationRouter);
apiRouter.use("/media", UploadDownloadRouter);
apiRouter.use("/attendance_records", attendanceRecordsRouter);
apiRouter.use("/upcoming_events", upcomingEventsRouter);
apiRouter.use("/mess_fee", MessFeeRouter);
apiRouter.use("/announcements", announcementRouter);

//website: its own extra endpoints first (dashboard, summaries, export...), then the shared ones
app.use(`${prefix_api}/website`, websiteRouter);
app.use(`${prefix_api}/website`, apiRouter);

//mobile app
app.use(`${prefix_api}/mobile`, apiRouter);

//legacy paths without a client prefix (e.g. /api/v1/students): installed app versions still use them.
//remove once every app in use calls /mobile
app.use(prefix_api, apiRouter);

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

app.use(
  "/uploaded-files",
  express.static(path.join(__dirName, "../uploaded-files"))
);

//public pages behind the links in activation / reset emails (opens the app), and Android App Links verification
app.use(appLinksRouter);

//GET /health: is the app up and can it reach the database (the deploy script waits for this)
app.use(healthRouter);

app.use(gloabalErrorHandlerMiddleware);

await startServerAndConnectDB(app);