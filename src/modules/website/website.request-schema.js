import { z } from "zod";

//GET /website/dashboard?date=2026-11-04&days=7
export const dashboardQuerySchema = z.object({
  date: z.iso.date().optional(),
  days: z.coerce.number().int().min(1).max(31).default(7)
});

//GET /website/students/:id/attendance-history?days=30
export const attendanceHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(60).default(30)
});

//GET /website/students/export - same filters as GET /students, without pagination
export const exportStudentsQuerySchema = z.object({
  by_student_name: z.string().optional(),
  by_department_id: z.coerce.number().int().min(1).optional(),
  by_room_id: z.coerce.number().int().min(1).optional(),
  by_roll_number: z.string().optional()
});
