import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export const toPrismaPagination = (page, pageSize) => {
  return { skip: (page - 1) * pageSize, take: pageSize };
};

export const buildMeta = (page, pageSize, totalCount) => {
  return {page: page, pageSize, totalPages: Math.max(1, Math.ceil(totalCount / pageSize)) };
};