import { NavLink, Link, Routes, Route } from "react-router-dom";
import TablesPage from "./pages/TablesPage";
import OrderPage from "./pages/OrderPage";
import MenuPage from "./pages/MenuPage";
import HistoryPage from "./pages/HistoryPage";
import ManageTablesPage from "./pages/ManageTable";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition ${
    isActive
      ? "bg-orange-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-xl font-bold">
            🍽️ Restaurant <span className="text-orange-600">Manager</span>
          </Link>

          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={navClass}>Tables</NavLink>
            <NavLink to="/menu" className={navClass}>Menu</NavLink>
            <NavLink to="/tables/manage" className={navClass}>Manage Tables</NavLink>
            <NavLink to="/history" className={navClass}>History</NavLink>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<TablesPage />} />
          <Route path="/orders/:id" element={<OrderPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/tables/manage" element={<ManageTablesPage />} />
          <Route
            path="*"
            element={<p className="py-10 text-center text-slate-500">Page not found</p>}
          />
        </Routes>
      </main>
    </div>
  );
}