import HostelAdminRepository from "./hostel-admins.repository.js";

const getHostelAdminSplashScreenData = async (accessContext) => {
  return await HostelAdminRepository.getHostelAdminProfile(accessContext.loggedInHostelAdminProfileId);
};

const HostelAdminService = {
  getHostelAdminSplashScreenData
};


export default HostelAdminService;