import express from "express";
import startServerAndConnectDB from "./server.js";
import authRouter from "./modules/auth/auth.routes.js";
import gloabalErrorHandlerMiddleware from "./middlewares/global-error-handler.middleware.js";
import envValues from "./configs/envFile.js";

const app = express();

const prefix_api = envValues.API_PREFIX;

app.use(express.json());

app.use(`${prefix_api}/auth`, authRouter);


app.use(gloabalErrorHandlerMiddleware);


await startServerAndConnectDB(app);
