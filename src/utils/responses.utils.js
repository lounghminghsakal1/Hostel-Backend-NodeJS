const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message: message,
    data: data,
    errors: null
  });
};

const failureResponse = (res, message, errors, statusCode = 500) => {
  return res.status(statusCode).json({
    status: "failure",
    message: message,
    data: null,
    errors: errors
  });
};

export const paginatedResponse = (res, message, data, meta, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
    meta
  });
};

const Responses = {
  successResponse,
  failureResponse,
  paginatedResponse
}; 

export default Responses;