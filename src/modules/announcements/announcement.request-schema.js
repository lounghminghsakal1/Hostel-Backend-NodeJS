import { z } from "zod";

export const createAnnouncementRequestBodySchema = z.object({
  priority: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.url().optional(),
  pushNotification: z.boolean().default(false),
  personalDivision: z.boolean().default(false)
});

export const updateAnnouncementRequestBodySchema = z.object({
  priority: z.number().int().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  url: z.url().optional(),
  pushNotification: z.boolean().optional(),
  personalDivision: z.boolean().optional()
});