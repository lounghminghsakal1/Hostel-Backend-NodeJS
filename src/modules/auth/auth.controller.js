import Responses from "../../utils/responses.utils.js";
import AuthService from "./auth.service.js";

const authLogin = async (req, res) => {
  const responseData = await AuthService.loginUser(req.body);
  return Responses.successResponse(res, "Logged in successful", responseData);
};

const AuthController = {
  authLogin,
};

export default AuthController;
