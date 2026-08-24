import { z } from "zod";

export const updateHostelRequestSchema = z.object({
  hostelName: z.string().optional(),
  location: z.string().optional(),
  latitude: z.float64().optional(),
  longitude: z.float64().optional(),
  contactPersonName: z.string().optional(),
  contactNumber: z.string().optional(),
});

