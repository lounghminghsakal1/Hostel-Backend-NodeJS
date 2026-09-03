import {z} from "zod";

export const loginRequestBodySchema = z.object({
  email: z.email(),
  password: z.string()
});
