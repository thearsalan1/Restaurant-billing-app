import { Schema, model } from "mongoose";

const orderItemSchema = new Schema({
  menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    status: {
      type: String,
      enum: ["OPEN", "PAID", "CANCELLED"],
      default: "OPEN",
    },
    items: [orderItemSchema],

    billedAt: { type: Date },
    subtotal: { type: Number, default: 0 },
    discountType: { type: String, enum: ["FLAT", "PERCENT"] },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    paymentMethod: { type: String, enum: ["CASH", "UPI", "CARD"] },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index(
  { table: 1 },
  { unique: true, partialFilterExpression: { status: "OPEN" } },
);

orderSchema.index({ createdAt: -1 });

export const Order = model("Order", orderSchema);
