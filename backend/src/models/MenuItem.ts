import { model, Schema } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Price must be an integer (in paise)",
      },
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

menuItemSchema.index({ name: "text" });

export const MenuItem = model("MenuItem", menuItemSchema);
