import { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

const input =
  "rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500";

export default function ManageTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [editingId, setEditingId] = useState<string | null>(null); // null = naya table add ho raha hai

  async function load() {
    try {
      const res = await api.get("/tables");
      setTables(res.data.data);
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
      return true;
    } catch (err) {
      alert(errorMessage(err));
      return false;
    }
  }

  function resetForm() {
    setNumber("");
    setCapacity("4");
    setEditingId(null);
  }

  function startEdit(t: any) {
    setEditingId(t._id);
    setNumber(String(t.number));
    setCapacity(String(t.capacity));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTable() {
    if (!number || Number(number) < 1) {
      alert("Enter a valid table number");
      return;
    }
    const body = { number: Number(number), capacity: Number(capacity) || 4 };
    const ok = await run(() =>
      editingId
        ? api.patch(`/tables/${editingId}`, body)
        : api.post("/tables", body),
    );
    if (ok) resetForm(); 
  }

  if (loading)
    return (
      <p className="py-10 text-center text-slate-500">Loading tables...</p>
    );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Manage Tables</h2>
        <p className="text-sm text-slate-500">
          {tables.length} tables in the restaurant
        </p>
      </div>

      {/* Add / Edit form */}
      <section
        className={`rounded-xl border p-4 shadow-sm ${editingId ? "border-orange-300 bg-orange-50" : "bg-white"}`}
      >
        <h3 className="mb-3 font-semibold">
          {editingId ? "✏️ Editing table" : "Add new table"}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="1"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Table no."
            className={`${input} w-32`}
          />
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Seats"
            className={`${input} w-28`}
          />
          <button
            onClick={saveTable}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            {editingId ? "Save changes" : "Add table"}
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

      {/* Tables list */}
      <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 font-medium">Table</th>
              <th className="p-3 font-medium">Seats</th>
              <th className="p-3 font-medium">Right now</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {tables.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No tables yet. Add your first table above.
                </td>
              </tr>
            )}
            {tables.map((t) => (
              <tr key={t._id} className="border-t hover:bg-slate-50">
                <td className="p-3 text-base font-bold">T{t.number}</td>
                <td className="p-3 text-slate-600">👥 {t.capacity}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.currentOrder
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {t.currentOrder ? "In use" : "Free"}
                  </span>
                </td>
                <td className="space-x-3 whitespace-nowrap p-3 text-right">
                  <button
                    onClick={() => startEdit(t)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      confirm(`Delete table ${t.number}?`) &&
                      run(() => api.delete(`/tables/${t._id}`))
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

      <p className="text-xs text-slate-500">
        A table that already has orders (even old paid ones) can't be deleted,
        so the order history stays intact.
      </p>
    </div>
  );
}
