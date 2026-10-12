import { z } from "zod";
import { Table, Order } from "../models";
import { AppError } from "../utils/AppError";
import {
  createTableSchema,
  updateTableSchema,
} from "../validators/table.validator";

type CreateInput = z.infer<typeof createTableSchema>;
type UpdateInput = z.infer<typeof updateTableSchema>;

async function assertNumberFree(number: number, excludeId?: string) {
  const existing = await Table.findOne({
    number,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (existing) throw new AppError(409, `Table ${number} already exists`);
}

export async function listTables() {
  const [tables, openOrders] = await Promise.all([
    Table.find().sort({ number: 1 }).lean(),
    Order.find({ status: "OPEN" })
      .select("table orderNumber items createdAt billedAt")
      .lean(),
  ]);

  const orderByTable = new Map(openOrders.map((o) => [String(o.table), o]));

  return tables.map((t) => {
    const order = orderByTable.get(String(t._id));
    return {
      ...t,
      currentOrder: order
        ? {
            _id: order._id,
            orderNumber: order.orderNumber,
            itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
            isBilled: !!order.billedAt,
            openedAt: order.createdAt,
          }
        : null,
    };
  });
}

export async function createTable(data: CreateInput) {
  await assertNumberFree(data.number);
  return Table.create(data);
}

export async function updateTable(id: string, data: UpdateInput) {
  if (data.number !== undefined) await assertNumberFree(data.number, id);
  const table = await Table.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!table) throw new AppError(404, "Table not found");
  return table;
}

export async function deleteTable(id: string) {
  const table = await Table.findById(id);
  if (!table) throw new AppError(404, "Table not found");

  const hasOrders = await Order.exists({ table: id });
  if (hasOrders) {
    throw new AppError(409, "Cannot delete: this table has order history");
  }

  await table.deleteOne();
}
