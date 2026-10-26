import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.utils.js";

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

export const getStudentsQuerySchema = paginationQuerySchema.extend({
  by_student_name: z.string().optional(),
  by_department_id: z.coerce.number().int().min(1).optional(),
  by_room_id: z.coerce.number().int().min(1).optional(),
  by_roll_number: z.string().optional(),
});
