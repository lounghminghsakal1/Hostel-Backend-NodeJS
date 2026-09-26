import bcrypt from "bcrypt";

export const getHasedVersionOfPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};