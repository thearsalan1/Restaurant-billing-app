import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage, money } from "../api";

const STATUSES = ["ALL", "OPEN", "PAID", "CANCELLED"];
const today = () => new Date().toLocaleDateString("en-CA"); 

const METHOD_ICON: Record<string, string> = {
  CASH: "💵",
  UPI: "📱",
  CARD: "💳",
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-orange-100 text-orange-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]); 
  const [paidOrders, setPaidOrders] = useState<any[]>([]); 
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("ALL");
  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState(today());

  useEffect(() => {
    api.get("/tables").then((res) => setTables(res.data.data));
    api
      .get("/orders", { params: { status: "PAID", limit: 100 } })
      .then((res) => setPaidOrders(res.data.data))
      .catch((err) => alert(errorMessage(err)));
  }, []);

  useEffect(() => {
    api
      .get("/orders", {
        params: {
          limit: 100,
          status: status === "ALL" ? undefined : status,
          table: tableId || undefined,
        },
      })
      .then((res) => setOrders(res.data.data))
      .catch((err) => alert(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [status, tableId]);

  const paidOnDate = paidOrders.filter(
    (o) => new Date(o.paidAt).toLocaleDateString("en-CA") === date,
  );
  const totalSales = paidOnDate.reduce((sum, o) => sum + o.total, 0);

  const byMethod = ["CASH", "UPI", "CARD"].map((method) => {
    const list = paidOnDate.filter((o) => o.paymentMethod === method);
    return {
      method,
      count: list.length,
      sales: list.reduce((sum, o) => sum + o.total, 0),
    };
  });

  return (
    <div className="space-y-5">
      {/* Heading + date picker */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">History & Sales</h2>
          <p className="text-sm text-slate-500">
            Past orders and daily sales summary
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          Sales for
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border bg-white px-3 py-1.5 outline-none focus:border-orange-500"
          />
        </label>
      </div>

      {/* Sales summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="col-span-2 rounded-xl bg-orange-600 p-4 text-white shadow-sm md:col-span-2">
          <p className="text-sm text-orange-100">Total sales</p>
          <p className="text-3xl font-bold">{money(totalSales)}</p>
          <p className="mt-1 text-sm text-orange-100">
            {paidOnDate.length} paid order{paidOnDate.length === 1 ? "" : "s"}
          </p>
        </div>

        {byMethod.map((m) => (
          <div
            key={m.method}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {METHOD_ICON[m.method]} {m.method}
            </p>
            <p className="text-xl font-bold">{money(m.sales)}</p>
            <p className="text-xs text-slate-400">
              {m.count} order{m.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              status === s
                ? "bg-orange-600 text-white"
                : "border bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}

        <select
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          className="ml-auto rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500"
        >
          <option value="">All tables</option>
          {tables.map((t) => (
            <option key={t._id} value={t._id}>
              Table {t.number}
            </option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Table</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Total</th>
              <th className="p-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Loading orders...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No orders found
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o._id} className="border-t hover:bg-slate-50">
                <td className="p-3">
                  <Link
                    to={`/orders/${o._id}`}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="p-3">T{o.table?.number}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status]}`}
                  >
                    {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="p-3 text-right font-medium">
                  {o.status === "PAID" ? money(o.total) : "-"}
                </td>
                <td className="whitespace-nowrap p-3 text-slate-500">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Showing the latest 100 orders.</p>
    </div>
  );
}
