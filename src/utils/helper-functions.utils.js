export const getAccessContext = (req) => {
  return {
    loggedInAdminHostelId: req.user.hostelAdminProfile.hostelId ?? null,
    loggedInAdminCollegeId: req.user.collegeId ?? null,
    loggedInStudentCollegeId: req.user.studentProfile.collegeId ?? null,
    loggedInStudentHostelId: req.user.studentProfile.hostelId ?? null,
    loggedInStudentProfileId: req.user.studentProfile.id
  };
};