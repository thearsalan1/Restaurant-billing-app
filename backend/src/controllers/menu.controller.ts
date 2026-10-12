import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/menu.service';
import { menuQuerySchema } from '../validators/menu.validator';

export const list = asyncHandler(async (req, res) => {
  const query = menuQuerySchema.parse(req.query); 
  res.json({ success: true, data: await service.listMenuItems(query) });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createMenuItem(req.body);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.updateMenuItem(req.params.id as string, req.body);
  res.json({ success: true, data });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const data = await service.setAvailability(req.params.id as string, req.body.isAvailable);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteMenuItem(req.params.id as string);
  res.json({ success: true, message: 'Menu item deleted' });
});