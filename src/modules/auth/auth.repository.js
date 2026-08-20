import { prisma } from "../../configs/db.js";

const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    },
    include: {
      role: true
    }
  });

  return user;
};

const AuthRepository = {
  findUserByEmail
};

export default AuthRepository;