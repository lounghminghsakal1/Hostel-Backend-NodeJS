import createHttpError from "http-errors";
import Responses from "../utils/responses.utils.js";

const gloabalErrorHandlerMiddleware = (err, req, res, next) => {
  //known prisma errors -> proper status codes instead of a 500
  if (err?.code === "P2002") {
    return Responses.failureResponse(res, "A record with these details already exists", "Duplicate record", 409);
  }
  if (err?.code === "P2025") {
    return Responses.failureResponse(res, "Record not found", "Record not found", 404);
  }

  const statusCode = err.statusCode ?? err.status ?? 500;

  //unexpected errors -> log the details on the server, never send internal messages (db, stack traces) to the client
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    //errors we threw on purpose with createHttpError (e.g. 503 face verification down) keep their message
    const isHttpError = createHttpError.isHttpError(err);
    const message = isHttpError ? err.message : "Something went wrong, please try again";
    return Responses.failureResponse(res, message, isHttpError ? (err.errors ?? "Server error") : "Internal server error", statusCode);
  }

  const errorMessage = err.message ?? "Something went wrong";
  const errors = err.errors ?? "Something went wrong";

  return Responses.failureResponse(res, errorMessage, errors, statusCode);
}

export default gloabalErrorHandlerMiddleware;
