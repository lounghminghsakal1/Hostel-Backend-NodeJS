import z from "zod";

export const createUpcomingEventRequestBodySchema = z.object({
  eventName: z.string(),
  eventDescription: z.string(),
  startingAt: z.string().datetime(),
  endingAt: z.coerce.date(),
  eventImageKey: z.string().optional(),
  eventLink: z.url().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export const updateUpcomingEventRequestBodySchema = createUpcomingEventRequestBodySchema.partial().extend({
  isActive: z.boolean().optional()
});

