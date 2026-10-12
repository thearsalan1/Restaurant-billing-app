import { model, Schema } from "mongoose";

const tableSchema = new Schema(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    status: {
      type: String,
      enum: ["FREE", "OCCUPIED"],
      default: "FREE",
    },
  },
  {
    timestamps: true,
  },
);

export const Table = model("Table", tableSchema);
