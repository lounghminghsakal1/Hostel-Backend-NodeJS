import { z } from "zod";

export const createRoomRequestBodySchema = z.object({
  roomNumber: z.string(),
  capacity: z.int().positive(),
});


export const updateRoomRequestBodySchema = createRoomRequestBodySchema.partial();
