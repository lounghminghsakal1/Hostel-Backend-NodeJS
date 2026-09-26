import crypto from "crypto";

export const generateActivationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto.createHash("sha-256").update(rawToken).digest("hex");

  return {
    rawToken, 
    hashedToken
  };
};


export const getHashedVersionOfToken = (token) => {
  return crypto.createHash("sha-256").update(token).digest("hex");
};


