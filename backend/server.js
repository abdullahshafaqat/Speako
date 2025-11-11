import dotenv from "dotenv";
import path from "path";
dotenv.config();

import { connectDB } from "./src/utils/db.js";
import app from "./src/app.js";
import { server } from "./src/utils/socket.js";

const __dirname = path.resolve();
connectDB();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"))
  );
}
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

