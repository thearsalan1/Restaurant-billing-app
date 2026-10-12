import assert from "node:assert/strict";
import { calculateBill } from "./billing";

assert.deepEqual(
  calculateBill({
    items: [{ unitPrice: 33333, quantity: 1 }],
    taxRatePercent: 5,
  }),
  {
    subtotal: 33333,
    discountAmount: 0,
    taxableAmount: 33333,
    taxAmount: 1667,
    total: 35000,
  },
);

assert.deepEqual(
  calculateBill({
    items: [{ unitPrice: 33333, quantity: 1 }],
    discountType: "PERCENT",
    discountValue: 10,
    taxRatePercent: 5,
  }),
  {
    subtotal: 33333,
    discountAmount: 3333,
    taxableAmount: 30000,
    taxAmount: 1500,
    total: 31500,
  },
);

assert.deepEqual(
  calculateBill({
    items: [
      { unitPrice: 34000, quantity: 1 },
      { unitPrice: 5000, quantity: 2 },
    ],
    discountType: "FLAT",
    discountValue: 5000,
    taxRatePercent: 5,
  }),
  {
    subtotal: 44000,
    discountAmount: 5000,
    taxableAmount: 39000,
    taxAmount: 1950,
    total: 40950,
  },
);

assert.equal(
  calculateBill({
    items: [{ unitPrice: 10000, quantity: 1 }],
    taxRatePercent: 2.5,
  }).total,
  10250,
);

assert.throws(() =>
  calculateBill({
    items: [{ unitPrice: 1000, quantity: 1 }],
    discountType: "FLAT",
    discountValue: 2000,
    taxRatePercent: 5,
  }),
);

console.log("billing checks passed");
