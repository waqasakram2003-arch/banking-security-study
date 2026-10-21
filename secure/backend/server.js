import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import connectDB from "./db.js";
import requestSanitizer from "./helpers/requestSanitizer.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const server = express();
const PORT = Number(process.env.PORT) || 3000;
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." }
});

await connectDB();

server.use(cors());
server.use(helmet());
server.use(apiLimiter);
server.use(express.json({ limit: "15mb" }));
server.use(requestSanitizer);
server.use("/api/applications", applicationRoutes);
server.use("/api/accounts", accountRoutes);
server.use("/api/users", userRoutes);
server.use("/api/cards", cardRoutes);
server.use("/api/transfers", transferRoutes);
server.use("/api/feedback", feedbackRoutes);
server.use("/api/loans", loanRoutes);
server.use("/api/transactions", transactionRoutes);

server.get("/", (req, res) => {
    res.send("Hello world");
});

server.listen(PORT,"0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

