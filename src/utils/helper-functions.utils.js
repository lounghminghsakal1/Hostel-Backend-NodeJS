import { GetObjectCommand } from "@aws-sdk/client-s3";
import envValues from "../configs/envFile.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../configs/s3.js";

export const getAccessContext = (req) => {
  return {
    loggedInAdminHostelId: req.user?.hostelAdminProfile?.hostelId ?? null,
    loggedInAdminCollegeId: req.user?.hostelAdminProfile?.collegeId ?? null,
    loggedInStudentHostelId: req.user?.studentProfile?.hostelId ?? null,
    loggedInStudentCollegeId: req.user?.studentProfile?.collegeId ?? null,

    loggedInStudentProfileId: req.user?.studentProfile?.id ?? null
  };
};

export const isValidTimeString = (timeString) => {
  const timeRegx = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegx.test(timeString);
};


export const getS3SignedUrlByKey = async (key, expiresIn = 300) => {
  const command = new GetObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: key,
    expiresIn: expiresIn
  });

  return await getSignedUrl(s3Client, command, {expiresIn: 300});

}; 