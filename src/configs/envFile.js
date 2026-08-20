import dotenv from "dotenv";

dotenv.config();

const envValues = {
  PORT: process.env.PORT,
  VERSION: process.env.VERSION,
  API_PREFIX: process.env.API_PREFIX,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL
};

export default envValues;
