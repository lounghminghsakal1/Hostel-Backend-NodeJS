import createHttpError from "http-errors";
import envValues from "../configs/envFile.js";
import { getS3SignedUrlByKey } from "../utils/helper-functions.utils.js";

//the python face verification server (hostel-management-faceverification), on the same machine by default
export const faceServerUrl = () => (envValues.FACE_VERIFICATION_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const photoCheckUnavailable = () => createHttpError(503, "The photo check is unavailable right now, please try again in a few minutes", { errors: "Face verification server unavailable" });

//student photos are uploaded by the admin app under these prefixes (see upload-download service)
const STUDENT_PHOTO_PREFIXES = ["student_image/", "students/"];

export const assertIsStudentPhotoKey = (imageKey) => {
  if (!STUDENT_PHOTO_PREFIXES.some(prefix => imageKey.startsWith(prefix))) {
    throw createHttpError(422, "This isn't a student photo upload", { errors: "Invalid student image key" });
  }
};

//asks the face server whether a photo is good enough to be a student's photo on file:
//exactly one clear, sharp, well-lit, front-facing face, big enough and inside the frame
//returns { ok, status: "OK" | "OK_WITH_WARNINGS" | "REJECTED", message, issues: [{ code, severity, message }] }
export const checkStudentPhoto = async (imageKey) => {
  assertIsStudentPhotoKey(imageKey);
  try {
    const response = await fetch(`${faceServerUrl()}/face/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: await getS3SignedUrlByKey(imageKey), purpose: "registration" }),
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Face server answered ${response.status}`);
    const result = await response.json();
    return {
      ok: Boolean(result.ok),
      status: result.status,
      message: result.message,
      issues: Array.isArray(result.issues) ? result.issues : []
    };
  } catch (err) {
    if (createHttpError.isHttpError(err)) throw err;
    console.error("Student photo check failed:", err);
    throw photoCheckUnavailable();
  }
};

//used when a student is created or their photo changes: a photo the face server rejects is refused,
//so every later check-in is compared against a usable photo
//(if the face server is down, the photo is accepted - the app already showed the admin the check result)
export const assertStudentPhotoUsable = async (imageKey) => {
  let result;
  try {
    result = await checkStudentPhoto(imageKey);
  } catch (err) {
    if (err.status === 503) {
      console.warn("Photo check skipped (face server unavailable) for", imageKey);
      return;
    }
    throw err;
  }
  if (!result.ok) {
    throw createHttpError(422, `Student photo can't be used: ${result.message}`, { errors: "Student photo not usable", issues: result.issues });
  }
};
