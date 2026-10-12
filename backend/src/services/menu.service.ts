import { z } from 'zod';
import { Category, MenuItem } from '../models';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/regex';
import { menuQuerySchema, createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.validator';

type MenuQuery = z.infer<typeof menuQuerySchema>;
type CreateInput = z.infer<typeof createMenuItemSchema>;
type UpdateInput = z.infer<typeof updateMenuItemSchema>;

async function assertCategoryExists(id: string) {
  const exists = await Category.exists({ _id: id });
  if (!exists) throw new AppError(404, 'Category not found');
}

export async function listMenuItems(q: MenuQuery) {
  const filter: Record<string, unknown> = {};
  if (q.category) filter.category = q.category;
  if (q.available) filter.isAvailable = q.available === 'true';
  if (q.veg) filter.isVeg = q.veg === 'true';
  if (q.search) filter.name = new RegExp(escapeRegex(q.search), 'i');

  return MenuItem.find(filter).populate('category', 'name').sort({ name: 1 });
}

export async function createMenuItem(data: CreateInput) {
  await assertCategoryExists(data.category);
  const item = await MenuItem.create(data);
  return item.populate('category', 'name');
}

export async function updateMenuItem(id: string, data: UpdateInput) {
  if (data.category) await assertCategoryExists(data.category);
  const item = await MenuItem.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('category', 'name');
  if (!item) throw new AppError(404, 'Menu item not found');
  return item;
}

export async function setAvailability(id: string, isAvailable: boolean) {
  return updateMenuItem(id, { isAvailable });
}

export async function deleteMenuItem(id: string) {
  const item = await MenuItem.findByIdAndDelete(id);
  if (!item) throw new AppError(404, 'Menu item not found');
}