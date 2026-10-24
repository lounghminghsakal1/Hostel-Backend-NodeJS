import z from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";
import { utcInstantSchema } from "../../utils/dates.utils.js";

export const createUpcomingEventRequestBodySchema = z.object({
  eventName: z.string(),
  eventDescription: z.string(),
  startingAt: utcInstantSchema, // Previous: z.string().datetime()
  endingAt: utcInstantSchema, // Previous: z.coerce.date()
  eventImageKey: z.string().optional(),
  eventLink: z.url().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export const updateUpcomingEventRequestBodySchema = createUpcomingEventRequestBodySchema.partial().extend({
  isActive: z.boolean().optional()
});

export const getUpcomingEventsQuerySchema = paginationQuerySchema.extend({
  by_event_name: z.string().optional(),
  from_date: z.iso.date().optional(),
  to_date: z.iso.date().optional(),
  is_active: z.enum(["true", "false"]).transform(value => value === "true").optional().default("false"),
}); 

