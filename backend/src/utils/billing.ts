import { AppError } from "./AppError";

export type DiscountType = "FLAT" | "PERCENT";

interface BillInput {
  items: { unitPrice: number; quantity: number }[];
  discountType?: DiscountType;
  discountValue?: number; 
  taxRatePercent: number; 
}

export interface BillResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

const percentOf = (amount: number, percent: number) =>
  Math.round((amount * Math.round(percent * 100)) / 10000);

export function calculateBill({
  items,
  discountType,
  discountValue = 0,
  taxRatePercent,
}: BillInput): BillResult {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  let discountAmount = 0;
  if (discountType === "FLAT") discountAmount = discountValue;
  if (discountType === "PERCENT")
    discountAmount = percentOf(subtotal, discountValue);

  if (discountAmount > subtotal) {
    throw new AppError(400, "Discount cannot exceed the subtotal");
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = percentOf(taxableAmount, taxRatePercent);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total: taxableAmount + taxAmount,
  };
}
