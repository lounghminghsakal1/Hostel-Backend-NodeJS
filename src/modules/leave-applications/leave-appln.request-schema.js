import { z } from "zod";

export const createLeaveApplicationRequestBodySchema = z.object({
  leaveReason: z.string(),
  fromDate: z.coerce.date({
    invalid_type_error: "Invalid date format"
  }),
  toDate: z.coerce.date({
    invalid_type_error: "Invalid date format"
  })
}).refine((data) => data.fromDate <= data.toDate, {
  message: "fromDate must be equal or before to toDate",
});

export const updateLeaveApplicationRequestBodySchema = z.object({
  leaveReason: z.string().optional(),
  fromDate: z.coerce.date({
    invalid_type_error: "Invalid date format"
  }).optional(),
  toDate: z.coerce.date({
    invalid_type_error: "Invalid date format"
  }).optional()
});

export const reviewLeaveApplicationRequestBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional()
});