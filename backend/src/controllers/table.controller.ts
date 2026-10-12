import { asyncHandler } from '../utils/asyncHandler';
import * as service from '../services/table.service';

export const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listTables() });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createTable(req.body);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.updateTable(req.params.id as string, req.body);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteTable(req.params.id as string);
  res.json({ success: true, message: 'Table deleted' });
});