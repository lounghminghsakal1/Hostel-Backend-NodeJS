import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";

export const createAttendanceRecordRequestBodySchema = z.object({
  capturedImageKey: z.string(),
  latitude: z.float64().min(-90).max(90),
  longitude: z.float64().min(-180).max(180)
});

export const getAllAttendanceRecordRequestQuerySchema = paginationQuerySchema.extend({
  date: z.iso.date().optional(),
  fromDate: z.iso.date().optional(),
  toDate: z.iso.date().optional(),
  by_student_name: z.string().optional(),
  by_student_department_id: z.coerce.number().int().min(1).optional(),
  by_student_room_id: z.coerce.number().int().min(1).optional(),
  by_roll_number: z.string().optional(),
  status: z.enum(["present", "absent"]).optional().default("present"),
  by_face_matching_percentage: z.coerce.number().min(0).max(100).optional(),
  //used as the Prisma operator: lt = "below 65%" (65 itself counts as trusted), gte = "65% or more"
  face_matching_operator: z.enum(["gte", "gt", "lte", "lt"]).optional().default("lte"),
  is_outside_hostel: z
    .enum(["true", "false"])
    .transform(value => value === "true")
    .optional()
});

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
