import createHttpError from "http-errors";

const authorizeUserMiddleware = (...roles) => {
  return (req, res, next) => {
    const loggedInUser = req.user;
    if(!roles.includes(loggedInUser.role.roleName)) throw createHttpError(403, "You don't have the access for this resource", {errors: "Unauthorized access"});
    next();
  };
};

export default authorizeUserMiddleware;