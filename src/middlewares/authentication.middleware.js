import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import envValues from "../configs/envFile.js";
import { prisma } from "../configs/db.js";

const authenticateUserMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw createHttpError(400, "Auth header is needed", { errors: "Missing auth header" });

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) throw createHttpError(400, "Token invalid, please login again", { errors: "Token invalid" });

  const decodedData = jwt.verify(token, envValues.JWT_SECRET_KEY);

  const user = await prisma.user.findUnique({
    where: { id: decodedData.userId },
    select: {
      id: true,
      email: true,
      status: true,
      role: {
        select: {
          id: true,
          roleName: true
        }
      },
      hostelAdminProfile: {
        select: {
          hostelId: true,
          hostel:{
            select: {
              collegeId: true
            }
          }
        }
      },
      studentProfile: true
    }
  });

  if(!user) throw createHttpError(404, "User not found", {errors: "user not found"});
  req.user = user;
  next();
};

export default authenticateUserMiddleware;