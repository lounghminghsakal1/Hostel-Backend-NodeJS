import { z } from "zod";

export const createStudentProfileRequestBodySchema = z.object({
  email: z.email(),
  studentName: z.string(),
  contactNumber: z.string().length(10),
  parentMobileNumber: z.string().length(10),
  departmentId: z.int().positive(),
  rollNumber: z.string(),
  studentImageKey: z.string().optional(),
  roomId: z.int().positive().optional()
});

export const updateStudentProfileRequestBodySchema = createStudentProfileRequestBodySchema.partial();

export const updateStudentStatusRequestBodySchema = z.object({
  status: z.enum(["INACTIVE", "SUSPENDED"])
});

export const changeOrAssignStudentRoomRequestBodySchema = z.object({
  roomId: z.int().positive()
});


export const setupNewPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string(),
  forgotPassword: z.boolean().optional(),
});

export const sendActivationLinkMailRequestQuerySchema = z.object({
  studentProfileId: z.string()
});

export const forgotPasswordRequestBodySchema = z.object({
  email: z.email()
});