import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt, { JwtPayload } from "jsonwebtoken";
import chatbotRouter from "./chatbot/chatRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 4200);
const host = process.env.HOST || "0.0.0.0";
const requireAuth = String(process.env.AI_REQUIRE_AUTH || "false").toLowerCase() === "true";
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

// Resolve KB paths consistently in dev (tsx) and production (dist/server.js).
process.env.KB_DIR = path.resolve(__dirname, process.env.KB_DIR || "kb");

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

function authenticateOptional(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    if (requireAuth) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }
    return next();
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    if (requireAuth) {
      return res.status(503).json({
        success: false,
        message: "AI authentication is not configured",
        code: "AUTH_NOT_CONFIGURED",
      });
    }
    return next();
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: process.env.JWT_ISSUER || undefined,
      audience: process.env.JWT_AUDIENCE || undefined,
    });

    if (typeof payload !== "object" || payload.type !== "access") {
      throw new Error("Invalid access token type");
    }

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
      code: "INVALID_ACCESS_TOKEN",
    });
  }
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: false,
}));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX || 30),
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "kavach-ai-chatbot-service",
    message: "Rakshak AI service is running",
    status: "online",
    health: "/health",
    chatbot: "/api/v1/chatbot/messages",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "kavach-ai-chatbot-service",
    providerConfigured: Boolean(process.env.GROQ_API_KEY),
    authRequired: requireAuth,
  });
});

app.use("/api", authenticateOptional, chatbotRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("AI service error:", err);
  res.status(500).json({
    success: false,
    message: "Internal AI service error",
    code: "AI_SERVICE_ERROR",
  });
});

app.listen(port, host, () => {
  console.log(`Kavach AI chatbot service listening on http://${host}:${port}`);
});
