import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import categoryRoutes from "./routes/category.routes";
import menuRoutes from "./routes/menu.routes";
import tableRoutes from "./routes/table.routes";
import orderRoutes from "./routes/order.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
