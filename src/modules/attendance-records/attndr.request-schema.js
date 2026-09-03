import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";

export const createAttendanceRecordRequestBodySchema = z.object({
  capturedImageUrl: z.url(),
  latitude: z.float64().min(-90).max(90),
  longitude: z.float64().min(-180).max(180)
});

export const getAllAttendanceRecordRequestQuerySchema = paginationQuerySchema.extend({
  date: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  fromDate: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  toDate: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  status: z.enum(["present", "absent"]).optional().default("present"),
});


