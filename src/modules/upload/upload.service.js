import StorageService from "../../infrastructure/storage/index.js";

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

const UploadService = {
  uploadAttendanceImage,
  uploadStudentProfileImage
};

export default UploadService;