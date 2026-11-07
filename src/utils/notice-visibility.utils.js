import { currentDateForDb } from "./dates.utils.js";

//one place for "what students can see" - used by the student splash, the student lists and the detail endpoints

//an announcement is LIVE when it's switched on (ACTIVE) and today (IST) is between its start and end dates (both inclusive)
export const liveAnnouncementWhere = () => {
  const today = currentDateForDb();
  return {
    status: "ACTIVE",
    startDate: { lte: today },
    endDate: { gte: today }
  };
};

//admin filter for the announcements list:
//live      - students see it now
//scheduled - switched on, starts later
//expired   - switched on, end date has passed
//off       - switched off (INACTIVE), never shown
export const announcementVisibilityWhere = (visibility) => {
  const today = currentDateForDb();
  switch (visibility) {
    case "live": return liveAnnouncementWhere();
    case "scheduled": return { status: "ACTIVE", startDate: { gt: today } };
    case "expired": return { status: "ACTIVE", endDate: { lt: today } };
    case "off": return { status: "INACTIVE" };
    default: return {};
  }
};

//students see events that are switched on and haven't ended yet: happening now (start <= now < end) or coming up
export const visibleEventWhere = () => ({
  isActive: true,
  endingAt: { gt: new Date() }
});

export const isStudentRequest = (accessContext) => !accessContext.loggedInAdminHostelId && Boolean(accessContext.loggedInStudentHostelId);
