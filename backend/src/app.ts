import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
