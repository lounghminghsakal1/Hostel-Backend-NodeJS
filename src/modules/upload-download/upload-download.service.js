import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import StorageService from "../../infrastructure/storage/index.js";
import envValues from "../../configs/envFile.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../configs/s3.js";
import createHttpError from "http-errors";
import { prisma } from "../../configs/db.js";

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
  const objectKey = `students/${accessContext.loggedInStudentProfileId}.jpg`;
  const command = new GetObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: objectKey,
    ContentType: "image/jpeg"
  });

  const downloadURL = await getSignedUrl(s3Client, command, { expiresIn: 300 });

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

  const presigneduploadURL = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return {
    uploadURL: presigneduploadURL,
    objectKey
  };
};

const getPresignedDownloadUrlForAttendanceImage = async (imageKey) => {
  if (!imageKey) throw createHttpError(422, "Image key not found", { errors: "Image key needed" });
  const command = new GetObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: imageKey,
    ContentType: "image/jpeg"
  });

  const presignedDownloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return {
    downloadUrl: presignedDownloadUrl,
    objectKey: imageKey
  };
};

const getPresignedUploadUrl = async (imageFor) => {
  const objectKey = `${imageFor}/${crypto.randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: objectKey,
    ContentType: "image/jpeg"
  });

  const presignedUploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadURL: presignedUploadUrl,
    objectKey
  };
};

const getPreSignedDownloadUrl = async (imageKey) => {
  const command = new GetObjectCommand({
    Bucket: envValues.AWS_S3_BUCKET_NAME,
    Key: imageKey,
    ContentType: "image/jpeg"
  });

  const presignedDownloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return {
    downloadUrl: presignedDownloadUrl,
    objectKey: imageKey
  };
};

//students upload only attendance selfies; admins upload student photos and event images
const UPLOAD_PURPOSES_BY_ROLE = {
  STUDENT: ["attendance_image"],
  HOSTEL_ADMIN: ["student_image", "event_image"]
};

const assertCanUpload = (mediaFor, user) => {
  const allowed = UPLOAD_PURPOSES_BY_ROLE[user.role.roleName] ?? [];
  if (!allowed.includes(mediaFor)) throw createHttpError(403, `You can't upload ${mediaFor}`, { errors: "Upload not allowed" });
};

//students may only open event images and their own profile photo, not other students' photos or selfies
const assertCanDownload = async (imageKey, user) => {
  if (user.role.roleName !== "STUDENT") return;
  if (imageKey.startsWith("event_image/") || imageKey.startsWith("events/")) return;
  const ownProfile = await prisma.studentProfile.findUnique({
    where: { id: user.studentProfile?.id ?? -1 },
    select: { studentImageKey: true }
  });
  if (ownProfile?.studentImageKey && ownProfile.studentImageKey === imageKey) return;
  throw createHttpError(403, "You don't have access to this image", { errors: "Image access denied" });
};

const UploadDownloadService = {
  uploadAttendanceImage,
  uploadStudentProfileImage,
  getPresignedUrlForUploadingAttendanceImage,
  getPresignedUrlForDownloadingStudentImage,
  getPresignedUrlForStudentImageUpload,
  getPresignedDownloadUrlForAttendanceImage,
  getPresignedUploadUrl,
  getPreSignedDownloadUrl,
  assertCanUpload,
  assertCanDownload,
};

export default UploadDownloadService;