import AuthRepository from "./auth.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import envValues from "../../configs/envFile.js";
import { getHashedVersionOfToken } from "../../utils/activation-token.utils.js";
import { prisma } from "../../configs/db.js";
import crypto from "crypto";
import { getHasedVersionOfPassword } from "../../utils/password.utils.js";

const loginUser = async (loginRequestBody) => {
  const user = await AuthRepository.findUserByEmail(loginRequestBody.email);
  if (!user) throw createHttpError(400, "Invalid credentials", { errors: "Invalid credentials" });

  if (!user.passwordHash || user.status === "PENDING_ACTIVATION") throw createHttpError(401, "Password setup not completed so contact admin to setup password for your account", { errors: "Password setup required" });
  if (user.status === "INACTIVE" || user.status === "SUSPENDED") throw createHttpError(401, "Your account is not active, please contact admin", { errors: "Account is not active" });

  const isPasswordValid = await bcrypt.compare(loginRequestBody.password, user.passwordHash);
  if (!isPasswordValid) throw createHttpError(400, "Invalid credentials", { errors: "Invalid credentials" });

  //email and password valid so create a session record in db 
  const { createdSession, createdRefreshToken, generatedRefreshToken } = await AuthRepository.createSession(user.id);

  const token = jwt.sign({ userId: user.id, role: user.role.roleName, sId: createdSession.id }, envValues.JWT_SECRET_KEY, { expiresIn: "15m" }); //access token expires in 15m and use refresh token to get new access token and refresh token also (old refresh token marked as usedAt and new one created)

  return {
    user: {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role.roleName
    },
    tokens: {
      accessToken: token,
      refreshToken: generatedRefreshToken
    }
  };
};

const refreshTokens = async (refreshTokensRequestBody) => {
  const { refreshToken } = refreshTokensRequestBody;

  const hashedRefreshToken = getHashedVersionOfToken(refreshToken);

  //validate refresh token and its session 
  const refreshTokenFromDb = await AuthRepository.getRefreshTokenByHashedRefreshToken(hashedRefreshToken);
  if (!refreshTokenFromDb) throw createHttpError(422, "Refresh token cannot be found", { errors: "Invalid refresh token" });

  if (refreshTokenFromDb.expiresAt < new Date()) throw createHttpError(409, "Refresh token expired, Please login", { errors: "Expired refresh token" });

  if (refreshTokenFromDb.revokedAt) {
    //already revoked
    throw createHttpError(409, "Refresh token already revoked, Please login again", { errors: "Refresh token already revoked" });
  }

  if (refreshTokenFromDb.authSession.expiresAt < new Date()) throw createHttpError(401, "session expired, please login again", { errors: "session expired" })

  if (refreshTokenFromDb.authSession.revokedAt) {
    //using revoked session - force login
    throw createHttpError(409, "Session revoked, please login again", { errors: "session revoked" });
  }


  //refresh token reuse found so potential token theft may happened so revoke session (revoke means invalidating session)
  if (refreshTokenFromDb.usedAt) {
    //this case means -> someone using already rotated refreshToken, possible hacker so invalidate the session itself 
    await AuthRepository.revokeSession(refreshTokenFromDb.authSession.id);

    //already used so force login again and invalidate its session also
    throw createHttpError(409, "Refresh token already used, please login again", { errors: "Refresh token already used" });
  }

  //check user is still access the application or not 
  const userId = refreshTokenFromDb.authSession.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: { select: { roleName: true } } } });
  if (!user) throw createHttpError(404, "User not found", { errors: "User not found" });
  if (user.status !== "ACTIVE") throw createHttpError(401, "User account is not active", { errors: "Account is not active" });

  //generate tokens now 
  const newAccessToken = jwt.sign({ userId: user.id, role: user.role.roleName, sId: refreshTokenFromDb.authSession.id }, envValues.JWT_SECRET_KEY, { expiresIn: '15m' });
  const newRefreshToken = crypto.randomBytes(32).toString("hex");
  const hashedNewRefreshToken = getHashedVersionOfToken(newRefreshToken);

  //rotate refresh token and update the session - using transaction

  const rotationResult = await prisma.$transaction(async (tx) => {
    //update the previous refresh token(which was sent in this request's body) as usedAt at now, 
    const updatedExistingRefreshToken = await tx.refreshToken.updateMany({
      where: {
        id: refreshTokenFromDb.id,
        refreshTokenHash: hashedRefreshToken,
        authSessionId: refreshTokenFromDb.authSessionId,
        usedAt: null,
        revokedAt: null,
        expiresAt: {
          gte: new Date()
        }
      },
      data: {
        usedAt: new Date()
      }
    });

    if (updatedExistingRefreshToken.count !== 1) return { success: false };

    //update session as - lastUsed as now , because we rotated refresh token of this session only
    const updatedSession = await tx.authSession.updateMany({
      where: {
        id: refreshTokenFromDb.authSession.id,
        revokedAt: null,
        expiresAt: {
          gte: new Date()
        }
      },
      data: {
        lastUsedAt: new Date()
      }
    });

    if (updatedSession.count !== 1) {
      // Throwing rolls back the old token update too.
      throw new Error("SESSION_NOT_ACTIVE");
    }

    //create new refreshToken record in refreshToken Table
    const newRefreshTokenRecored = await tx.refreshToken.create({
      data: {
        authSessionId: refreshTokenFromDb.authSession.id,
        refreshTokenHash: hashedNewRefreshToken,
        expiresAt: refreshTokenFromDb.authSession.expiresAt
      }
    });

    return { success: true, newRefreshTokenRecored };

  });

  if (!rotationResult.success) {
    //again read the state of refreshtoken
    const refreshTokenRedAgain = await prisma.refreshToken.findUnique({
      where: {
        id: refreshTokenFromDb.id
      }
    });

    if (refreshTokenRedAgain?.usedAt) {
      //refresh token consumed by another refresh request so revoke the session because token maybe theft by hacker
      //but it can be a legitimate request also so we handle this next js frontend bff
      await AuthRepository.revokeSession(refreshTokenRedAgain.authSessionId)
    }
    if (refreshTokenRedAgain.revokedAt) {

    }

    throw createHttpError(401, "Cannot rotate refresh token", { errors: "Refresh token cannot be rotated" });
  }

  return { newAccessToken, newRefreshToken };
};

const logout = async (user, sessionId, logoutRequestBody) => {
  const { refreshToken } = logoutRequestBody;
  const hashedRefeshToken = getHashedVersionOfToken(refreshToken);

  const refreshTokenFromDb = await AuthRepository.getRefreshTokenByHashedRefreshToken(hashedRefeshToken);
  if (!refreshTokenFromDb) throw createHttpError(422, "Refresh token cannot be found", { errors: "Invalid refresh token" });

  if (refreshTokenFromDb.authSession.userId !== user.id) throw createHttpError(403, "Invalid refresh token", { errors: "Invalid refresh token" });

  if (refreshTokenFromDb.authSessionId !== sessionId) throw createHttpError(403, "Refresh token does not belong to the current session"); 

  // if (refreshTokenFromDb.usedAt || refreshTokenFromDb.expiresAt < new Date() || refreshTokenFromDb.revokedAt) {
  //   //refresh token may be theft so logout from all sessions which belongs to that user 
  //   // await AuthRepository.logoutFromAllSessionsAndRevokeRefreshToken(refreshTokenFromDb);
  //   await AuthRepository.revokeThisSessionAndThisRefreshTokenOnly(refreshTokenFromDb);
  //   return "Logged out successfully";
  // }

  //revoke that refresh token and its session only
  // const result = await AuthRepository.revokeThisSessionAndThisRefreshTokenOnly(refreshTokenFromDb);
  await AuthRepository.revokeSession(sessionId);

  return "Logged out successfully";
};

const changePassword = async (accessContext, changePasswordRequestBody) => {
  const {
    currentPassword, 
    newPassword
  } = changePasswordRequestBody;

  //check currentPassword is correct or not
  const isPasswordCorrect = await AuthRepository.isPasswordCorrect(accessContext?.userId, getHasedVersionOfPassword(currentPassword));
  if(!isPasswordCorrect) throw createHttpError(400, "Invalid current password", {errors: "Invalid current password"});

  //set new password 
  await AuthRepository.setNewPasswordToUser(accessContext.userId, getHasedVersionOfPassword(newPassword));

  return "Password updated";
};

const AuthService = {
  loginUser,
  refreshTokens,
  logout,
  changePassword
};

export default AuthService;