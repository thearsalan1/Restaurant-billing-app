import { z } from "zod";
import { Order, Table, MenuItem, getNextSequence } from "../models";
import { AppError } from "../utils/AppError";
import { orderQuerySchema } from "../validators/order.validator";
import { env } from "../config/env";
import { calculateBill } from "../utils/billing";
import { billSchema } from "../validators/order.validator";

type BillInput = z.infer<typeof billSchema>;

type OrderQuery = z.infer<typeof orderQuerySchema>;

const editableFilter = (orderId: string) => ({
  _id: orderId,
  status: "OPEN" as const,
  billedAt: null,
});

async function assertEditable(orderId: string) {
  const order = await Order.findById(orderId).select("status billedAt").lean();
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "OPEN") {
    throw new AppError(409, `Order is already ${order.status.toLowerCase()}`);
  }
  if (order.billedAt) {
    throw new AppError(409, "Bill already generated, order is locked");
  }
}

export async function getOrder(id: string) {
  const order = await Order.findById(id)
    .populate("table", "number capacity")
    .lean();
  if (!order) throw new AppError(404, "Order not found");

  return {
    ...order,
    runningSubtotal: order.items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    ),
  };
}

export async function listOrders(q: OrderQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.table) filter.table = q.table;

  return Order.find(filter)
    .populate("table", "number")
    .sort({ createdAt: -1 })
    .limit(q.limit)
    .lean();
}

export async function createOrder(tableId: string) {
  const table = await Table.findById(tableId);
  if (!table) throw new AppError(404, "Table not found");

  const busyMsg = `Table ${table.number} already has an open order`;

  if (await Order.exists({ table: tableId, status: "OPEN" })) {
    throw new AppError(409, busyMsg);
  }

  let order;
  try {
    order = await Order.create({
      orderNumber: await getNextSequence("order"),
      table: tableId,
    });
  } catch (err) {
    if ((err as { code?: number })?.code === 11000)
      throw new AppError(409, busyMsg);
    throw err;
  }

  await Table.updateOne({ _id: tableId }, { status: "OCCUPIED" });
  return getOrder(String(order._id));
}

export async function addItem(
  orderId: string,
  menuItemId: string,
  quantity: number,
) {
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) throw new AppError(404, "Menu item not found");
  if (!menuItem.isAvailable) {
    throw new AppError(400, `${menuItem.name} is currently unavailable`);
  }

  const editable = editableFilter(orderId);

  const incrementExisting = () =>
    Order.updateOne(
      { ...editable, "items.menuItem": menuItem._id },
      { $inc: { "items.$.quantity": quantity } },
    );

  let result = await incrementExisting();

  if (result.matchedCount === 0) {
    result = await Order.updateOne(
      { ...editable, "items.menuItem": { $ne: menuItem._id } },
      {
        $push: {
          items: {
            menuItem: menuItem._id,
            name: menuItem.name,
            unitPrice: menuItem.price,
            quantity,
          },
        },
      },
    );

    if (result.matchedCount === 0) {
      await assertEditable(orderId);
      await incrementExisting();
    }
  }

  return getOrder(orderId);
}

export async function updateItemQuantity(
  orderId: string,
  itemId: string,
  quantity: number,
) {
  const result = await Order.updateOne(
    { ...editableFilter(orderId), "items._id": itemId },
    { $set: { "items.$.quantity": quantity } },
  );

  if (result.matchedCount === 0) {
    await assertEditable(orderId);
    throw new AppError(404, "Item not found in this order");
  }
  return getOrder(orderId);
}

export async function removeItem(orderId: string, itemId: string) {
  const result = await Order.updateOne(
    { ...editableFilter(orderId), "items._id": itemId },
    { $pull: { items: { _id: itemId } } },
  );

  if (result.matchedCount === 0) {
    await assertEditable(orderId);
    throw new AppError(404, "Item not found in this order");
  }
  return getOrder(orderId);
}

export async function cancelOrder(orderId: string) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: "OPEN" },
    { status: "CANCELLED" },
    { new: true },
  );

  if (!order) {
    const exists = await Order.exists({ _id: orderId });
    throw exists
      ? new AppError(409, "Only open orders can be cancelled")
      : new AppError(404, "Order not found");
  }

  await Table.updateOne({ _id: order.table }, { status: "FREE" });
  return getOrder(orderId);
}

export async function previewBill(orderId: string, input: BillInput) {
  const order = await Order.findById(orderId).select("status items").lean();
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "OPEN")
    throw new AppError(409, `Order is already ${order.status.toLowerCase()}`);

  return calculateBill({
    items: order.items,
    discountType: input.discountType,
    discountValue: input.discountValue,
    taxRatePercent: env.TAX_RATE,
  });
}

export async function generateBill(orderId: string, input: BillInput) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: "OPEN", "items.0": { $exists: true } },
    { $set: { billedAt: new Date() } },
    { new: false },
  );

  if (!order) {
    const existing = await Order.findById(orderId).select("status").lean();
    if (!existing) throw new AppError(404, "Order not found");
    if (existing.status !== "OPEN")
      throw new AppError(
        409,
        `Order is already ${existing.status.toLowerCase()}`,
      );
    throw new AppError(400, "Cannot generate a bill for an empty order");
  }

  let calc;
  try {
    calc = calculateBill({
      items: order.items,
      discountType: input.discountType,
      discountValue: input.discountValue,
      taxRatePercent: env.TAX_RATE,
    });
  } catch (err) {
    if (!order.billedAt)
      await Order.updateOne({ _id: orderId }, { $unset: { billedAt: "" } });
    throw err;
  }

  const fields = {
    subtotal: calc.subtotal,
    discountValue: input.discountValue ?? 0,
    discountAmount: calc.discountAmount,
    taxRate: env.TAX_RATE,
    taxAmount: calc.taxAmount,
    total: calc.total,
  };

  await Order.updateOne(
    { _id: orderId },
    input.discountType
      ? { $set: { ...fields, discountType: input.discountType } }
      : { $set: fields, $unset: { discountType: "" } },
  );

  return getOrder(orderId);
}

export async function payOrder(
  orderId: string,
  paymentMethod: "CASH" | "UPI" | "CARD",
) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: "OPEN", billedAt: { $ne: null } },
    { $set: { status: "PAID", paymentMethod, paidAt: new Date() } },
    { new: true },
  );

  if (!order) {
    const existing = await Order.findById(orderId).select("status").lean();
    if (!existing) throw new AppError(404, "Order not found");
    if (existing.status !== "OPEN")
      throw new AppError(
        409,
        `Order is already ${existing.status.toLowerCase()}`,
      );
    throw new AppError(400, "Generate the bill before taking payment");
  }

  await Table.updateOne({ _id: order.table }, { status: "FREE" });
  return getOrder(orderId);
}
