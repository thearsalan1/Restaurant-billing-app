import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage, money, toPaise } from "../api";

const tab = (active: boolean) =>
  `rounded px-3 py-1 text-sm ${active ? "bg-orange-600 text-white" : "bg-slate-200"}`;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Menu filters
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  // Discount + preview
  const [discountType, setDiscountType] = useState("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => alert(errorMessage(err)));
    api.get("/categories").then((res) => setCategories(res.data.data));
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get("/menu", {
          params: {
            search: search || undefined,
            veg: vegOnly ? "true" : undefined,
            category: category === "all" ? undefined : category,
          },
        })
        .then((res) => setMenu(res.data.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, vegOnly, category]);

  async function update(request: Promise<any>) {
    try {
      const res = await request;
      setOrder(res.data.data);
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  function changeQty(item: any, newQty: number) {
    if (newQty < 1) {
      update(api.delete(`/orders/${id}/items/${item._id}`));
    } else {
      update(
        api.patch(`/orders/${id}/items/${item._id}`, { quantity: newQty }),
      );
    }
  }

  function discountBody() {
    if (discountType === "NONE") return {};
    return {
      discountType,
      discountValue:
        discountType === "FLAT"
          ? toPaise(Number(discountValue))
          : Number(discountValue),
    };
  }

  async function previewBill() {
    try {
      const res = await api.post(`/orders/${id}/bill/preview`, discountBody());
      setPreview(res.data.data);
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function generateBill() {
    await update(api.post(`/orders/${id}/bill`, discountBody()));
    setPreview(null);
  }

  function pay(method: string) {
    update(api.post(`/orders/${id}/pay`, { paymentMethod: method }));
  }

  async function cancelOrder() {
    if (!confirm("Cancel this order?")) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      navigate("/");
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  if (!order) return <p>Loading...</p>;

  const billed = !!order.billedAt;
  const canEdit = order.status === "OPEN" && !billed; // bill ke baad items lock

  return (
    <div>
      <Link to="/" className="text-orange-600 print:hidden">
        ← Back to tables
      </Link>
      <h2 className="my-2 text-xl font-bold">
        Order #{order.orderNumber} · Table {order.table.number}
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        {new Date(order.createdAt).toLocaleString()}
      </p>

      <div
        className={canEdit ? "grid gap-4 md:grid-cols-2" : "mx-auto max-w-md"}
      >
        {/* LEFT: menu */}
        {canEdit && (
          <div className="print:hidden">
            <div className="mb-2 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item..."
                className="flex-1 rounded border p-2"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                />{" "}
                Veg
              </label>
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory("all")}
                className={tab(category === "all")}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCategory(c._id)}
                  className={tab(category === c._id)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {menu.length === 0 && (
                <p className="text-sm text-slate-500">No items found</p>
              )}
              {menu.map((m) => (
                <button
                  key={m._id}
                  disabled={!m.isAvailable}
                  onClick={() =>
                    update(
                      api.post(`/orders/${id}/items`, {
                        menuItemId: m._id,
                        quantity: 1,
                      }),
                    )
                  }
                  className="flex w-full justify-between rounded border bg-white p-3 text-left disabled:opacity-40"
                >
                  <span>
                    {m.isVeg ? "🟢" : "🔴"} {m.name}
                    {!m.isAvailable && " (unavailable)"}
                  </span>
                  <span>{money(m.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT: cart + bill */}
        <div className="rounded border bg-white p-4">
          <h3 className="mb-2 font-bold">Items</h3>

          {order.items.length === 0 && (
            <p className="text-sm text-slate-500">
              No items yet. Tap a menu item to add.
            </p>
          )}

          {order.items.map((item: any) => (
            <div
              key={item._id}
              className="flex items-center justify-between border-b py-2"
            >
              <div>
                <p>{item.name}</p>
                <p className="text-xs text-slate-500">
                  {money(item.unitPrice)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => changeQty(item, item.quantity - 1)}
                      className="rounded border px-2"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item, item.quantity + 1)}
                      className="rounded border px-2"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <span>x{item.quantity}</span>
                )}
                <span className="w-20 text-right">
                  {money(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-3 space-y-1 text-sm">
            <Row
              label="Subtotal"
              value={money(billed ? order.subtotal : order.runningSubtotal)}
            />
            {billed && (
              <>
                <Row
                  label="Discount"
                  value={"- " + money(order.discountAmount)}
                />
                <Row
                  label={`GST (${order.taxRate}%)`}
                  value={money(order.taxAmount)}
                />
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </>
            )}
          </div>

          {/* Discount + Preview + Generate Bill */}
          {order.status === "OPEN" && order.items.length > 0 && (
            <div className="mt-4 print:hidden">
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setPreview(null);
                  }}
                  className="rounded border p-1"
                >
                  <option value="NONE">No discount</option>
                  <option value="PERCENT">Percent %</option>
                  <option value="FLAT">Flat ₹</option>
                </select>
                {discountType !== "NONE" && (
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      setPreview(null);
                    }}
                    placeholder="value"
                    className="w-24 rounded border p-1"
                  />
                )}
              </div>

              {preview && (
                <div className="mt-2 space-y-1 rounded bg-blue-50 p-2 text-sm">
                  <Row label="Subtotal" value={money(preview.subtotal)} />
                  <Row
                    label="Discount"
                    value={"- " + money(preview.discountAmount)}
                  />
                  <Row label="GST" value={money(preview.taxAmount)} />
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total will be</span>
                    <span>{money(preview.total)}</span>
                  </div>
                </div>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  onClick={previewBill}
                  className="flex-1 rounded border border-blue-600 py-2 text-blue-600"
                >
                  Preview
                </button>
                <button
                  onClick={generateBill}
                  className="flex-1 rounded bg-blue-600 py-2 text-white"
                >
                  {billed ? "Update Bill" : "Generate Bill"}
                </button>
              </div>
            </div>
          )}

          {order.status === "OPEN" && billed && (
            <div className="mt-4 print:hidden">
              <p className="mb-1 text-sm font-medium">Take payment:</p>
              <div className="flex gap-2">
                {["CASH", "UPI", "CARD"].map((method) => (
                  <button
                    key={method}
                    onClick={() => pay(method)}
                    className="flex-1 rounded bg-green-600 py-2 text-white"
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          )}

          {order.status === "OPEN" && (
            <button
              onClick={cancelOrder}
              className="mt-3 w-full rounded border border-red-500 py-2 text-red-600 print:hidden"
            >
              Cancel order
            </button>
          )}

          {order.status === "PAID" && (
            <div className="mt-4">
              <p className="text-center font-medium text-green-700">
                ✅ Paid via {order.paymentMethod}
              </p>
              <button
                onClick={() => window.print()}
                className="mt-2 w-full rounded bg-slate-800 py-2 text-white print:hidden"
              >
                🖨️ Print Bill
              </button>
            </div>
          )}

          {order.status === "CANCELLED" && (
            <p className="mt-4 text-center text-red-600">
              This order was cancelled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
