import { z } from "zod";

export const createAnnouncementRequestBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  linkUrl: z.url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  pushNotification: z.boolean().default(false),
  isImportant: z.boolean().default(false)
});

export const updateAnnouncementRequestBodySchema = createAnnouncementRequestBodySchema.partial();