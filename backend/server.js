import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./src/utils/db.js";
import app from "./src/app.js";
import { server } from "./src/utils/socket.js";

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

