import AuthRepository from "./auth.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import envValues from "../../configs/envFile.js";

const loginUser = async (loginRequestBody) => {
  const user = await AuthRepository.findUserByEmail(loginRequestBody.email);
  if (!user) throw createHttpError(400, "Invalid credentials", { errors: "Invalid credentials" });

  const isPasswordValid = await bcrypt.compare(loginRequestBody.password, user.passwordHash);
  if (!isPasswordValid) throw createHttpError(400, "Invalid credentials", { errors: "Invalid credentials" });

  const token = await jwt.sign({ userId: user.id, role: user.role.roleName }, envValues.JWT_SECRET_KEY, { expiresIn: "1d" });

  return {
    user: {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role.roleName
    },
    token: token
  };
};

const AuthService = {
  loginUser
};

export default AuthService;