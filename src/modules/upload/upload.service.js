import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import StorageService from "../../infrastructure/storage/index.js";
import envValues from "../../configs/envFile.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../configs/s3.js";

const uploadAttendanceImage = async (capturedFile) => {
  const urlFromStorageService = await StorageService.upload(capturedFile);
  return {
    "url": urlFromStorageService
  };
};

const uploadStudentProfileImage = async (profileImageFile) => {
  const urlFromStorageService = await StorageService.upload(profileImageFile);
  return {
    "url": urlFromStorageService
  }
}; 

const getPresignedUrlForUploadingAttendanceImage = async () => {
  const randomId = crypto.randomUUID();
  const objectKey = `attendance/captures/${randomId}.jpg`;

  const command = new PutObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: objectKey,
    ContentType: "image/jpeg"
  });

  const uploadURL = await getSignedUrl(
    s3Client,
    command,
    { expiresIn: 300 }
  );

  return {
    uploadURL,
    objectKey
  };
};

const getPresignedUrlForDownloadingStudentImage = async (accessContext) => {
  const objectKey = `student-images/${accessContext.loggedInStudentProfileId}.jpg`;
  const command = new GetObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: objectKey,
    ContentType: "image/jpeg"
  });

  const downloadURL = await getSignedUrl(s3Client, command, {expiresIn: 300});

  return {
    downloadURL,
    objectKey
  };
};

const getPresignedUrlForStudentImageUpload = async (studentImageUploadGetPresignedURlBody) => {
  const profileId = studentImageUploadGetPresignedURlBody?.studentProfileId ?? crypto.randomUUID();
  const objectKey = `students/${profileId}.jpg`;
  const command = new PutObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: objectKey,
    ContentType: "image/jpeg"
  });

  const presigneduploadURL = await getSignedUrl(s3Client, command, {expiresIn: 300});
  return {
    uploadURL: presigneduploadURL,
    objectKey
  };
};

const UploadService = {
  uploadAttendanceImage,
  uploadStudentProfileImage,
  getPresignedUrlForUploadingAttendanceImage,
  getPresignedUrlForDownloadingStudentImage,
  getPresignedUrlForStudentImageUpload
};

export default UploadService;