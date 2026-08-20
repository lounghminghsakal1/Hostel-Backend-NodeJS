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

const Responses = {
  successResponse,
  failureResponse
}; 

export default Responses;