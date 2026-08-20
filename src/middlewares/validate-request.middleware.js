import createHttpError from "http-errors";

const validateRequestMiddleware = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if(!result.success) {
      throw new createHttpError(422, "Invalid request payload", {
        errors: formatZodErrors(result.error.issues)
      });
    }
    req.body = result.data;
    next();
  };
};

const formatZodErrors = (zodErrors) => {
  return zodErrors.reduce((formattedErrorObject, error) => {
    const errorKey = error.path.length > 0 ? error.path.join(".") : "issue";
    formattedErrorObject[errorKey] = error.message;
    return formattedErrorObject;
  }, {});
};

export default validateRequestMiddleware;
