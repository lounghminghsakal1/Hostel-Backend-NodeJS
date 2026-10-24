import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";
import { calendarDateSchema } from "../../utils/dates.utils.js";

export const createLeaveApplicationRequestBodySchema = z.object({
  leaveReason: z.string(),
  fromDate: calendarDateSchema, // Previous: z.coerce.date({ invalid_type_error: "Invalid date format" })
  toDate: calendarDateSchema // Previous: z.coerce.date({ invalid_type_error: "Invalid date format" })
}).refine((data) => data.fromDate <= data.toDate, {
  message: "fromDate must be equal or before to toDate",
});

export const updateLeaveApplicationRequestBodySchema = z.object({
  leaveReason: z.string().optional(),
  fromDate: calendarDateSchema.optional(), // Previous: z.coerce.date({ invalid_type_error: "Invalid date format" }).optional()
  toDate: calendarDateSchema.optional() // Previous: z.coerce.date({ invalid_type_error: "Invalid date format" }).optional()
});

export const reviewLeaveApplicationRequestBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional()
});

export const getAllLeaveApplicationRequestQuerySchema = paginationQuerySchema.extend({
  by_student_name: z.string().optional(),
  by_student_room_id: z.coerce.number().int().min(1).optional(),
  by_student_department_id: z.coerce.number().int().min(1).optional(),
  by_student_roll_number: z.string().optional(),
  by_status: z.string().optional()
});

