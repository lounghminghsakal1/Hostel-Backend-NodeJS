import createHttpError from "http-errors";
import Responses from "../utils/responses.utils.js";

//one readable line for the logs (pm2 logs only shows the last lines, and a full Prisma error is mostly stack trace)
const summarizeError = (err) => {
  const parts = [err?.name ?? "Error"];
  if (err?.code) parts.push(err.code);
  let message = String(err?.message ?? "").replace(/\s+/g, " ").trim();
  //Prisma driver adapter errors keep the database's own message in meta / cause
  const dbMessage = err?.meta?.driverAdapterError?.cause?.originalMessage
    ?? err?.meta?.driverAdapterError?.cause?.message
    ?? err?.cause?.originalMessage
    ?? err?.cause?.message;
  if (dbMessage && !message.includes(dbMessage)) message += ` | database: ${dbMessage}`;
  if (err?.meta?.column) message += ` | column: ${err.meta.column}`;
  if (err?.meta?.table) message += ` | table: ${err.meta.table}`;
  return `${parts.join(" ")}: ${message.slice(0, 600)}`;
};

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
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${statusCode} ${summarizeError(err)}`);
    //the database is missing a table/column the code uses: a migration wasn't applied on this server
    if (err?.code === "P2021" || err?.code === "P2022") {
      console.error("[ERROR] The database is behind the Prisma schema. Run: npx prisma migrate deploy");
    }
    console.error(err);
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
