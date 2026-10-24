import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import HostelAdminService from "./hostel-admins.service.js";

const getHostelAdminSplashScreenData = async (req, res) => {
  const accessContext = getAccessContext(req);
  const hostelAdminSplashScreenData = await HostelAdminService.getHostelAdminSplashScreenData(accessContext);
  return Responses.successResponse(res, "Hostel admin splash screen data fetched successfully", hostelAdminSplashScreenData);
};


const HostelAdminController = {
getHostelAdminSplashScreenData
};

export default HostelAdminController;