import z from "zod";
import { objectId } from "./common";

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  category: objectId,
  price: z.number().int("Price must be in paise (integer)").min(0),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

// Update
export const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export const availabilitySchema = z.object({ isAvailable: z.boolean() });

// /menu query params
export const menuQuerySchema = z.object({
  category: objectId.optional(),
  search: z.string().trim().optional(),
  available: z.enum(["true", "false"]).optional(),
  veg: z.enum(["true", "false"]).optional(),
});
