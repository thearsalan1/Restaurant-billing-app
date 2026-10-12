import { z } from "zod";
import { objectId } from "./common";

export const createOrderSchema = z.object({
  tableId: objectId,
});

export const addItemSchema = z.object({
  menuItemId: objectId,
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1)
    .max(50)
    .default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int("Quantity must be a whole number").min(1).max(50),
});

export const orderItemParamsSchema = z.object({
  id: objectId,
  itemId: objectId,
});

export const orderQuerySchema = z.object({
  status: z.enum(["OPEN", "PAID", "CANCELLED"]).optional(),
  table: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const billSchema = z
  .object({
    discountType: z.enum(["FLAT", "PERCENT"]).optional(),
    discountValue: z.number().min(0).optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.discountType && d.discountValue) {
      ctx.addIssue({
        code: "custom",
        path: ["discountType"],
        message: "discountType is required with discountValue",
      });
    }
    if (d.discountType && d.discountValue === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "discountValue is required with discountType",
      });
    }
    if (
      d.discountType === "FLAT" &&
      d.discountValue !== undefined &&
      !Number.isInteger(d.discountValue)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Flat discount must be in paise (integer)",
      });
    }
    if (
      d.discountType === "PERCENT" &&
      d.discountValue !== undefined &&
      d.discountValue > 100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percent cannot exceed 100",
      });
    }
  });

export const paySchema = z.object({
  paymentMethod: z.enum(["CASH", "UPI", "CARD"]),
});
