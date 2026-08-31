import envValues from "../../configs/envFile.js";

const upload = (file) => {
  const baseURL = envValues.BASE_URL;
  return `${baseURL}/${file.path.replaceAll("\\", "/")}`;
};

const LocalStorage = {
  upload,
};

export default LocalStorage;