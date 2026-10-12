import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";

type Table = {
  _id: string;
  number: number;
  capacity: number;
  currentOrder: {
    _id: string;
    orderNumber: number;
    itemCount: number;
    isBilled: boolean;
  } | null;
};

function look(table: Table) {
  if (!table.currentOrder) {
    return {
      card: "border-green-200 bg-white hover:border-green-400 hover:shadow-md",
      badge: "bg-green-100 text-green-700",
      label: "Free",
      info: "Tap to start an order",
    };
  }
  const o = table.currentOrder;
  if (o.isBilled) {
    return {
      card: "border-blue-300 bg-blue-50 hover:shadow-md",
      badge: "bg-blue-100 text-blue-700",
      label: "Bill ready",
      info: `Order #${o.orderNumber} · awaiting payment`,
    };
  }
  return {
    card: "border-orange-300 bg-orange-50 hover:shadow-md",
    badge: "bg-orange-100 text-orange-700",
    label: "Occupied",
    info: `Order #${o.orderNumber} · ${o.itemCount} item${o.itemCount === 1 ? "" : "s"}`,
  };
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadTables() {
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
    loadTables();
  }, []);

  async function openTable(table: Table) {
    if (table.currentOrder) {
      navigate(`/orders/${table.currentOrder._id}`);
      return;
    }
    try {
      const res = await api.post("/orders", { tableId: table._id });
      navigate(`/orders/${res.data.data._id}`);
    } catch (err) {
      alert(errorMessage(err));
      loadTables();
    }
  }

  const free = tables.filter((t) => !t.currentOrder).length;
  const billReady = tables.filter((t) => t.currentOrder?.isBilled).length;
  const occupied = tables.length - free - billReady;

  if (loading)
    return (
      <p className="py-10 text-center text-slate-500">Loading tables...</p>
    );

  return (
    <div>
      {/* Heading + counts */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Tables</h2>
          <p className="text-sm text-slate-500">
            Tap a table to open or continue its order
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" /> {free} Free
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> {occupied}{" "}
            Occupied
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> {billReady}{" "}
            Bill ready
          </span>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-white py-10 text-center text-slate-500">
          No tables yet. Add some from the Manage Tables page.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tables.map((table) => {
            const s = look(table);
            return (
              <button
                key={table._id}
                onClick={() => openTable(table)}
                className={`rounded-xl border-2 p-4 text-left transition ${s.card}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-2xl font-bold">T{table.number}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  👥 Seats {table.capacity}
                </p>
                <p className="mt-3 text-sm text-slate-700">{s.info}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
