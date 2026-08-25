import { z } from "zod";

export const createStudentProfileRequestSchema = z.object({
  email: z.email(),
  studentName: z.string(),
  contactNumber: z.string().length(10),
  parentMobileNumber: z.string().length(10),
  departmentId: z.int().positive(),
  roomId: z.int().positive().optional()
});

export const updateStudentProfileRequestSchema = createStudentProfileRequestSchema.partial();

export const updateStudentStatusRequestSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"])
});

export const changeOrAssignStudentRoomRequestSchema = z.object({
  roomId: z.int().positive()
});
