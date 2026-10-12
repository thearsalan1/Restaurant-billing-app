import { Category, MenuItem } from '../models';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/regex';


async function assertNameFree(name: string, excludeId?: string) {
  const existing = await Category.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (existing) throw new AppError(409, 'Category already exists');
}

export async function listCategories() {
  return Category.find().sort({ name: 1 });
}

export async function createCategory(name: string) {
  await assertNameFree(name);
  return Category.create({ name });
}

export async function updateCategory(id: string, name: string) {
  await assertNameFree(name, id);
  const category = await Category.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
  if (!category) throw new AppError(404, 'Category not found');
  return category;
}

export async function deleteCategory(id: string) {
  const itemCount = await MenuItem.countDocuments({ category: id });
  if (itemCount > 0) {
    throw new AppError(409, `Cannot delete: ${itemCount} menu item(s) use this category`);
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError(404, 'Category not found');
}