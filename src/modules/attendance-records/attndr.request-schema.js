import { z } from "zod";

export const createAttendanceRecord = z.object({
  capturedImageUrl: z.url(),
  latitude: z.float64().min(-90).max(90),
  longitude: z.float64().min(-180).max(180)
});
