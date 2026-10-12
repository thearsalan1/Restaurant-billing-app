import { z } from "zod";

export const createTableSchema = z.object({
  number: z.number().int("Table number must be an integer").min(1),
  capacity: z.number().int().min(1).max(20).optional(),
});

export const updateTableSchema = createTableSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );
