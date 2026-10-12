import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/category.service";

export const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listCategories() });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createCategory(req.body.name);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.updateCategory(
    req.params.id as string,
    req.body.name,
  );
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.id as string);
  res.json({ success: true, message: "Category deleted" });
});
