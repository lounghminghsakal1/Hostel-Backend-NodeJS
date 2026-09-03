import { z } from "zod";

export const updateHostelRequestBodySchema = z.object({
  hostelName: z.string().optional(),
  location: z.string().optional(),
  latitude: z.float64().min(-90).max(90).optional(),
  longitude: z.float64().min(-180).max(180).optional(),
  contactPersonName: z.string().optional(),
  contactNumber: z.string().optional(),

  attendanceMarkingStartTime: z.string().optional(),
  attendanceMarkingEndTime: z.string().optional(),
  attendanceRadius: z.float64().optional()
});

