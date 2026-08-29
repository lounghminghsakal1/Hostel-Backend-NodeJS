import { z } from "zod";

export const createLeaveApplicationSchema = z.object({
  leaveReason: z.string().maxLength(200),
  fromDate: z.date(),
  toDate: z.date(),
});