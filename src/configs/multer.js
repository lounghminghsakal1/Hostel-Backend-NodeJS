import multer from "multer";
import path from "path";

const createFileUploader = (folderName) => {

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploaded-files/${folderName}`);
    },
    filename: (req, file, cb) => {
      const studentId = req?.user?.studentProfile?.id ?? 9999;
      const uniqueFileName = Date.now() + " - " + studentId + " - " + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
      cb(null, uniqueFileName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    console.log("originalname:", file.originalname);
    console.log("mimetype:", file.mimetype);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

};

export default createFileUploader;