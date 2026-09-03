import createHttpError from "http-errors";
import { ZodError } from "zod";


//next() simply means -> continue with next request handler in the chain,
//next(err) means -> express will infer it as -> next with 1 argument so it must be a error so skip all middlewares/request handlers just proceed to error handler 
// how express finds error handler ?? -> the one with 4 params , (err, req, res, next) => {}

//schemas is an object containing body, query, params like this {body: {}, query: {}, params: {}}
const validateRequestMiddleware = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body && req.body) {
        req.body = schemas.body.parse(req.body); // safeParse returns an object like this -> {success: true, data: {}, issues: {} }
      }
      if (schemas.query && req.query) {
         // req.query is a read-only getter in Express 5; store parsed values separately.
         attachValidatedQueryToReq(req, schemas.query.parse(req.query));
      }
      if (schemas.params && req.params) {
        req.params = schemas.params.parse(req.params); // parse returns data explicitly
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(createHttpError(422, "Invalid request", {
          errors: formatZodErrors(err.issues)
        })); 
        //we can do throw also here because express 5 will catch thrown errors and pass it to next error handler 
        // throw new createHttpError(422, "Invalid request", {errors: err.flatten().fieldErrors});
      } else {
        next(err);
      }
    }

  };
};

const attachValidatedQueryToReq = (req, value) => {
  Object.defineProperty(req, "validatedQuery", { value, writable: true, configurable: true});
}

const formatZodErrors = (zodErrors) => {
  return zodErrors.reduce((formattedErrorObject, error) => {
    const errorKey = error.path.length > 0 ? error.path.join(".") : "issue";
    formattedErrorObject[errorKey] = error.message;
    return formattedErrorObject;
  }, {});
};

export default validateRequestMiddleware;
