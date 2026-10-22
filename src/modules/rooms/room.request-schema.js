import { z } from "zod";

export const createRoomRequestBodySchema = z.object({
  roomNumber: z.string(),
  capacity: z.int().positive(),
});


export const updateRoomRequestBodySchema = createRoomRequestBodySchema.partial();

export const getRoomsListingQuerySchema = z.object({
  starts_with: z.string().optional(),
  only_vacancy: z.boolean().optional()
});
