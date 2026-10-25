import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";

const calendarDateSchema = z.iso.date()
  .transform(value => new Date(`${value}T00:00:00.000Z`));

const announcementBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  linkUrl: z.url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  announcementType: z.enum([
  "COLLEGE_ANNOUNCEMENT",
  "HOSTEL_ANNOUNCEMENT",
  "OTHER"
]).optional(),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema,
  pushNotification: z.boolean(),
  isImportant: z.boolean()
});

export const createAnnouncementRequestBodySchema = announcementBodySchema.refine(data => data.startDate <= data.endDate, {
  path: ["endDate"],
  message: "endDate must be on or after startDate"
});;

export const updateAnnouncementRequestBodySchema = announcementBodySchema.partial();

export const getAnnouncementRequestQuerySchema = paginationQuerySchema.extend({
  by_announcement_title: z.string().optional(),
  by_status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  from_date: z.iso.date().transform(value => new Date(`${value}T00:00:00.000Z`)).optional(),
  to_date: z.iso.date().transform(value => new Date(`${value}T00:00:00.000Z`)).optional(),
  by_announcement_type: z.enum(["COLLEGE_ANNOUNCEMENT", "HOSTEL_ANNOUNCEMENT", "OTHER"]).optional(),
  only_important: z.enum(["true", "false"]).transform(value => value === "true").optional()
});

