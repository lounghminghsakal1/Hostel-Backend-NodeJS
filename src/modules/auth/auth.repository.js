import { prisma } from "../../configs/db.js";
import { getHashedVersionOfToken } from "../../utils/activation-token.utils.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

//case-insensitive: an admin may have typed the student's email with capitals
const findUserByEmail = async (email) => {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive"
      }
    },
    include: {
      role: true
    }
  });

  return user;
};

const createSession = async (userId) => {
  const now = new Date();
  const sessionExpiry = new Date(now);
  sessionExpiry.setDate(sessionExpiry.getDate() + 7);

  const refreshTokenExpiry = new Date(now);
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  const generatedRefreshToken = crypto.randomBytes(32).toString("hex");
  const hashedRefreshToken = getHashedVersionOfToken(generatedRefreshToken);


  const result = await prisma.$transaction(async (tx) => {
    //session creation
    const createdSession = await tx.authSession.create({
      data: {
        userId: userId,
        expiresAt: sessionExpiry,
      }
    });


    //refresh token record creation
    const createdRefreshToken = await tx.refreshToken.create({
      data: {
        authSessionId: createdSession.id,
        expiresAt: refreshTokenExpiry,
        refreshTokenHash: hashedRefreshToken
      }
    });

    return { createdSession, createdRefreshToken };
  });

  return { ...result, generatedRefreshToken };
};

const getRefreshTokenByHashedRefreshToken = async (hashedRefeshToken) => {
  return await prisma.refreshToken.findUnique({
    where: {
      refreshTokenHash: hashedRefeshToken
    },
    include: {
      authSession: {
        select: {
          id: true,
          userId: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
          revokedAt: true
        }
      }
    }
  });
};

const revokeSession = async (sessionId) => {
  return await prisma.$transaction(async (tx) => {
    const revokedSession = await tx.authSession.update({
      where: {
        id: sessionId
      },
      data: {
        revokedAt: new Date()
      }
    });

    //revoke all refresh tokens related to it also 
    const revokedRefreshTokens = await tx.refreshToken.updateMany({
      where: {
        authSessionId: sessionId
      },
      data: {
        revokedAt: new Date()
      }
    });

    return { revokedSession, revokedRefreshTokens };
  });

};

const logoutFromAllSessionsAndRevokeRefreshToken = async (refreshTokenFromDb) => {
  return await prisma.$transaction(async (tx) => {
    //revoke all session which belongs to the user
    const revokedSessions = await tx.authSession.updateMany({
      where: {
        userId: refreshTokenFromDb.authSession.userId
      },
      data: {
        revokedAt: new Date()
      }
    });

    //revoke the refresh token also 
    const revokedRefreshToken = await tx.refreshToken.update({
      where: {
        id: refreshTokenFromDb.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    return { revokedSessions, revokedRefreshToken };
  });
};

const revokeThisSessionAndThisRefreshTokenOnly = async (refreshTokenFromDb) => {
  return await prisma.$transaction(async (tx) => {
    //revoke this session only
    const revokedSession = await tx.authSession.update({
      where: {
        id: refreshTokenFromDb.authSession.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    //revoke this refreshToken also
    const revokedRefreshToken = await tx.refreshToken.updateMany({
      where: {
        authSessionId: refreshTokenFromDb.authSessionId
      },
      data: {
        revokedAt: new Date()
      }
    });

    return {revokedSession, revokedRefreshToken};
  });
};

const isPasswordCorrect = async (userId, currentPassword) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      passwordHash: true
    }
  });
  if (!user?.passwordHash) return false;
  return await bcrypt.compare(currentPassword, user.passwordHash);
};

const setNewPasswordToUser = async (userId, newPasswordHash) => {
  return await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      passwordHash: newPasswordHash
    }
  });
};

const AuthRepository = {
  findUserByEmail,
  createSession,
  getRefreshTokenByHashedRefreshToken,
  revokeSession,
  logoutFromAllSessionsAndRevokeRefreshToken,
  revokeThisSessionAndThisRefreshTokenOnly,
  isPasswordCorrect,
  setNewPasswordToUser
};

export default AuthRepository;