export const getAccessContext = (req) => {
  return {
    loggedInAdminHostelId: req.user?.hostelAdminProfile?.hostelId ?? null,
    loggedInAdminCollegeId: req.user?.hostelAdminProfile?.collegeId ?? null,
    loggedInStudentHostelId: req.user?.studentProfile?.hostelId ?? null,
    loggedInStudentCollegeId: req.user?.studentProfile?.collegeId ?? null,

    loggedInStudentProfileId: req.user?.studentProfile?.id ?? null
  };
};