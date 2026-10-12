import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/order.service";
import { orderQuerySchema } from "../validators/order.validator";

export const list = asyncHandler(async (req, res) => {
  const query = orderQuerySchema.parse(req.query);
  res.json({ success: true, data: await service.listOrders(query) });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await service.getOrder(req.params.id as string),
  });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createOrder(req.body.tableId);
  res.status(201).json({ success: true, data });
});

export const addItem = asyncHandler(async (req, res) => {
  const { menuItemId, quantity } = req.body;
  const data = await service.addItem(
    req.params.id as string,
    menuItemId,
    quantity,
  );
  res.status(201).json({ success: true, data });
});

export const updateItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params as { id: string; itemId: string };
  const data = await service.updateItemQuantity(id, itemId, req.body.quantity);
  res.json({ success: true, data });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params as { id: string; itemId: string };
  const data = await service.removeItem(id, itemId);
  res.json({ success: true, data });
});

export const cancel = asyncHandler(async (req, res) => {
  const data = await service.cancelOrder(req.params.id as string);
  res.json({ success: true, data });
});

export const previewBill = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.previewBill(req.params.id as string, req.body) });
});

export const generateBill = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.generateBill(req.params.id as string, req.body) });
});

export const pay = asyncHandler(async (req, res) => {
  const data = await service.payOrder(req.params.id as string, req.body.paymentMethod);
  res.json({ success: true, data });
});