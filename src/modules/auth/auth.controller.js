import Responses from "../../utils/responses.utils.js";
import AuthService from "./auth.service.js";

const authLogin = async (req, res) => {
  const responseData = await AuthService.loginUser(req.body);
  return Responses.successResponse(res, "Logged in successful", responseData);
};

const refreshTokens = async (req, res) => {
  const {newAccessToken, newRefreshToken} = await AuthService.refreshTokens(req.body);
  return Responses.successResponse(res, "Tokens refreshed suceessfully", {accessToken: newAccessToken, refreshToken: newRefreshToken});
};

const logout = async (req, res) => {
  const user = req.user;
  const sessionId = req.auth.sessionId;
  const logoutResponse = await AuthService.logout(user, sessionId, req.body);
  return Responses.successResponse(res, "Logged out successfully", logoutResponse);
};

const AuthController = {
  authLogin,
  refreshTokens,
  logout
};

export default AuthController;
