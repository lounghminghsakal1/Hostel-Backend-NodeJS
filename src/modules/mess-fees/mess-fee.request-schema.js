import z from "zod";
import { calendarDateSchema } from "../../utils/dates.utils.js";
import { MONTHS } from "./mess-fee.constants.js";

//which months are allowed (current / next month only) is checked in the service, because it depends on today's date
export const createMonthlyMessBillRequestBodySchema = z.object({
  month: z.enum(MONTHS),
  year: z.int(),
  amount: z.float64().positive().max(1000000),
  lastDate: calendarDateSchema, // Previous: z.coerce.date()
});

export const updateMonthlyMessBillRequestBodySchema = createMonthlyMessBillRequestBodySchema.partial();
