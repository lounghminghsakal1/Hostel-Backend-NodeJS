import Responses from "../utils/responses.utils.js";

const gloabalErrorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const errorMessage = err.message ?? "Something went wrong";
  const errors = err.errors ?? "Something went wrong";
  
  return Responses.failureResponse(res, errorMessage, errors, statusCode);
}

export default gloabalErrorHandlerMiddleware;