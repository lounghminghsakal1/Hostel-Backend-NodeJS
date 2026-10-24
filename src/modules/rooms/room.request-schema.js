import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";

export const createRoomRequestBodySchema = z.object({
  roomNumber: z.string().trim().min(1),
  capacity: z.int().positive(),
});


export const updateRoomRequestBodySchema = createRoomRequestBodySchema.partial();

export const getRoomsListingQuerySchema = paginationQuerySchema.extend({
  starts_with: z.string().optional(),
  only_vacancy: z.enum(["true", "false"]).transform(value => value === "true").optional().default(false),
  by_student_name: z.string().optional(),
  by_student_roll_number: z.string().optional()
});
