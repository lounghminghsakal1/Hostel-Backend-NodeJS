import { z } from "zod";

export const createRoomRequestSchema = z.object({
  roomNumber: z.string(),
  capacity: z.int().positive(),
});


export const updateRoomRequestSchema = createRoomRequestSchema.partial();
