import { useEffect, useState } from "react";
import api, { errorMessage, money, toPaise } from "../api";

function VegDot({ veg }: { veg: boolean }) {
  const color = veg ? "border-green-600" : "border-red-600";
  const dot = veg ? "bg-green-600" : "bg-red-600";
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${color}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </span>
  );
}

const input =
  "rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500";

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [newCategory, setNewCategory] = useState("");

  async function load() {
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get("/menu"),
        api.get("/categories"),
      ]);
      setItems(menuRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: () => Promise<any>) {
    try {
      await action();
      await load();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  const selectedCategory = categoryId || categories[0]?._id;

  function resetForm() {
    setName("");
    setPrice("");
    setCategoryId("");
    setIsVeg(true);
    setEditingId(null);
  }

  function startEdit(m: any) {
    setEditingId(m._id);
    setName(m.name);
    setPrice(String(m.price / 100));
    setCategoryId(m.category._id);
    setIsVeg(m.isVeg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem() {
    const body = {
      name,
      category: selectedCategory,
      price: toPaise(Number(price)),
      isVeg,
    };
    await run(() =>
      editingId
        ? api.patch(`/menu/${editingId}`, body)
        : api.post("/menu", body),
    );
    resetForm();
  }

  async function addCategory() {
    await run(() => api.post("/categories", { name: newCategory }));
    setNewCategory("");
  }

  function renameCategory(c: any) {
    const newName = prompt("New category name", c.name);
    if (newName)
      run(() => api.patch(`/categories/${c._id}`, { name: newName }));
  }

  if (loading)
    return <p className="py-10 text-center text-slate-500">Loading menu...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Menu</h2>
        <p className="text-sm text-slate-500">
          {items.length} items · {categories.length} categories
        </p>
      </div>

      {/* Categories */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Categories</h3>

        <div className="mb-3 flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">
              No categories yet. Add one below.
            </p>
          )}
          {categories.map((c) => (
            <span
              key={c._id}
              className="flex items-center gap-2 rounded-full border bg-slate-50 py-1 pl-3 pr-2 text-sm"
            >
              {c.name}
              <button
                onClick={() => renameCategory(c)}
                title="Rename"
                className="rounded-full px-1 text-blue-600 hover:bg-blue-100"
              >
                ✎
              </button>
              <button
                onClick={() =>
                  confirm(`Delete category ${c.name}?`) &&
                  run(() => api.delete(`/categories/${c._id}`))
                }
                title="Delete"
                className="rounded-full px-1 text-red-500 hover:bg-red-100"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className={`${input} flex-1 sm:max-w-xs`}
          />
          <button
            onClick={addCategory}
            className="rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-900"
          >
            + Add
          </button>
        </div>
      </section>

      {/* Add / Edit item */}
      <section
        className={`rounded-xl border p-4 shadow-sm ${editingId ? "border-orange-300 bg-orange-50" : "bg-white"}`}
      >
        <h3 className="mb-3 font-semibold">
          {editingId ? "✏️ Editing item" : "Add new item"}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className={`${input} min-w-40 flex-1`}
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price ₹"
            className={`${input} w-28`}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setCategoryId(e.target.value)}
            className={input}
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              isVeg
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-red-500 bg-red-50 text-red-600"
            }`}
          >
            <input
              type="checkbox"
              checked={isVeg}
              onChange={(e) => setIsVeg(e.target.checked)}
              className="accent-green-600"
            />
            {isVeg ? "Veg" : "Non-veg"}
          </label>

          <button
            onClick={saveItem}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            {editingId ? "Save changes" : "Add item"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      {/* Items list */}
      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Available</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No menu items yet. Add your first item above.
                </td>
              </tr>
            )}
            {items.map((m) => (
              <tr key={m._id} className="border-t hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <VegDot veg={m.isVeg} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{m.category.name}</td>
                <td className="p-3 font-medium">{money(m.price)}</td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      run(() =>
                        api.patch(`/menu/${m._id}/availability`, {
                          isAvailable: !m.isAvailable,
                        }),
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      m.isAvailable
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {m.isAvailable ? "● Available" : "○ Unavailable"}
                  </button>
                </td>
                <td className="space-x-3 whitespace-nowrap p-3 text-right">
                  <button
                    onClick={() => startEdit(m)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      confirm(`Delete ${m.name}?`) &&
                      run(() => api.delete(`/menu/${m._id}`))
                    }
                    className="font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
