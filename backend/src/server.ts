import { connectDB } from "./config/db";
import app from "./app";
import { env } from "./config/env";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server is running at port: http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start the server: ", err);
  process.exit(1);
});
