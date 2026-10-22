import z from "zod";

export const createMonthlyMessBillRequestBodySchema = z.object({
  month: z.enum(["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]),
  year: z.int(),
  amount: z.float64(),
  lastDate: z.coerce.date(),
});

export const updateMonthlyMessBillRequestBodySchema = createMonthlyMessBillRequestBodySchema.partial();