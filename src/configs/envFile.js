import dotenv from "dotenv";

dotenv.config();

const envValues = {
  PORT: process.env.PORT,
  VERSION: process.env.VERSION,
  API_PREFIX: process.env.API_PREFIX,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  BASE_URL: process.env.BASE_URL,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL,
  //optional: region for Amazon SES email (e.g. ap-south-1); AWS_REGION (used by S3) when not set
  AWS_SES_REGION: process.env.AWS_SES_REGION,
  //optional: comma separated web origins allowed by CORS (defaults to localhost:3000/3001)
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  //optional: python face verification server (defaults to http://127.0.0.1:8000)
  FACE_VERIFICATION_URL: process.env.FACE_VERIFICATION_URL,
  //optional: sender name shown in emails (defaults to "Our Hostel")
  AWS_SES_FROM_NAME: process.env.AWS_SES_FROM_NAME,
  //optional: SHA-256 fingerprints of the Android app's signing certificate(s), comma separated, for App Links
  ANDROID_APP_SHA256_FINGERPRINTS: process.env.ANDROID_APP_SHA256_FINGERPRINTS
};

export default envValues;
