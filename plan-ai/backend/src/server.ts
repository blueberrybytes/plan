import dotenv from "dotenv";
dotenv.config();
import "./sentry/sentry";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { type Options } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger/swagger.json";
import path from "path";
import EnvUtils from "./utils/EnvUtils";
import { logger } from "./utils/logger";
import { RegisterRoutes } from "./routes/routes";
import chatRouter from "./routes/chatRouter";
import chatStreamingRouter from "./routes/chatStreamingRouter";
import gitnexusRouter from "./routes/gitnexusRouter";
import { mcpRouter } from "./routes/mcpRouter";
import { initializeContextVectorStore } from "./vector/contextFileVectorService";
import { setupAudioStream } from "./routes/audioStream";
import { microsoftMobileStart, microsoftMobileCallback } from "./controller/sessionController";
// Initialize background workers
import { githubContextWorker } from "./workers/githubContextWorker";
import { githubContextQueue } from "./queue/githubContextQueue";
import { pricingSyncWorker } from "./workers/pricingSyncWorker";
import { pricingSyncQueue } from "./queue/pricingSyncQueue";
import { weeklyDigestWorker } from "./workers/weeklyDigestWorker";
import { weeklyDigestQueue } from "./queue/weeklyDigestQueue";
import { transcriptGenerationWorker } from "./workers/transcriptGenerationWorker";
import { transcriptGenerationQueue } from "./queue/transcriptGenerationQueue";
import { taskRefinementWorker } from "./workers/taskRefinementWorker";
import { taskRefinementQueue } from "./queue/taskRefinementQueue";
import { contextDocumentWorker } from "./workers/contextDocumentWorker";
import { contextDocumentQueue } from "./queue/contextDocumentQueue";
import { pricingCacheService } from "./services/pricingCacheService";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import basicAuth from "express-basic-auth";
import * as Sentry from "@sentry/node";
import multer from "multer";

console.log("Server starting...");
const app = express();
const PORT = EnvUtils.get("PORT") || 8080;
const QDRANT_URL = EnvUtils.get("QDRANT_URL") || "http://127.0.0.1:6333";

// Middlewares

// Trust the first proxy hop (nginx, ALB, Cloud Run, etc.) so Express reads
// the real client IP from X-Forwarded-For. Required for express-rate-limit to
// work correctly behind a reverse proxy.
app.set("trust proxy", 1);
app.use(helmet());

// CORS — in production set CORS_ORIGINS="https://plan-ai.blueberrybytes.com,https://other.domain"
// When unset (local dev), all origins are allowed.
const corsOriginsEnv = EnvUtils.get("CORS_ORIGINS", "");
const corsOrigin: cors.CorsOptions["origin"] = corsOriginsEnv
  ? corsOriginsEnv.split(",").map((s) => s.trim())
  : true; // true = reflect request origin (allow all, safe for local dev)

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "x-api-key",
      "X-Workspace-Id",
      "X-Current-Path",
    ],
    credentials: true,
  }),
);
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(
  bodyParser.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      // Required for GitHub webhook signature validation
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

// Add route logging middleware before registering routes
app.use((req, res, next) => {
  if (process.env.ENV === "local") {
    console.debug(`Request received: ${req.method} ${req.path}`);
  }
  next();
});

// Disable browser caching for all API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Rate-limit breach handler — logs + reports to Sentry for visibility
const rateLimitHandler: Options["handler"] = (
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
  options,
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const limiterName = options.max === 20 ? "ai" : "api";
  logger.warn(`[rate-limit] ${limiterName} limit hit — IP=${ip} path=${req.path}`);
  Sentry.captureEvent({
    message: `Rate limit exceeded (${limiterName})`,
    level: "warning",
    tags: { limiter: limiterName },
    extra: { ip, path: req.path, method: req.method, limit: options.max },
  });
  res.status(options.statusCode).json(options.message);
};

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  handler: rateLimitHandler,
});

// Tighter limiter for AI-heavy endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Please wait before making another request." },
  handler: rateLimitHandler,
});

app.use("/api/", apiLimiter);
app.use("/api/chat", aiLimiter);
app.use("/api/presentations/generate", aiLimiter);
app.use("/api/documents/generate", aiLimiter);
app.use("/api/diagrams/generate", aiLimiter);

// Register TSOA routes (with role-based access control and increased upload limits)
RegisterRoutes(app, {
  multer: multer({
    limits: {
      fileSize: 524288000, // 500MB
    },
  }),
});

// Register manual routes
app.use("/api/chat", chatRouter);
app.use("/api/chat-streaming", chatStreamingRouter);
app.use(gitnexusRouter);

// Microsoft Mobile OAuth (not TSOA — these must redirect, not return JSON)
app.get("/api/auth/microsoft/mobile-start", microsoftMobileStart);
app.get("/api/auth/microsoft/mobile-callback", microsoftMobileCallback);

// Plan AI MCP Server — outside /api to avoid TSOA middleware
app.use("/mcp", mcpRouter);

// Swagger Documentation
app.get("/api-docs/json", (req, res) => {
  res.sendFile(path.join(__dirname, "swagger", "swagger.json"), {
    headers: {
      "Content-Type": "application/json",
    },
  });
});

// Swagger documentation route
const swaggerServeHandlers = swaggerUi.serve as unknown as RequestHandler[];
const swaggerSetupHandler = swaggerUi.setup(swaggerDocument) as unknown as RequestHandler;
app.use("/api-docs", ...swaggerServeHandlers, swaggerSetupHandler);

app.get("/prisma-schema", (req, res) => {
  const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
  res.setHeader("Content-Type", "text/plain");
  res.sendFile(schemaPath);
});

// Setup Bull Board UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [
    new BullMQAdapter(githubContextQueue),
    new BullMQAdapter(pricingSyncQueue),
    new BullMQAdapter(transcriptGenerationQueue),
    new BullMQAdapter(taskRefinementQueue),
    new BullMQAdapter(contextDocumentQueue),
    new BullMQAdapter(weeklyDigestQueue),
  ],
  serverAdapter: serverAdapter,
});

const basicAuthMiddleware = basicAuth({
  users: {
    // EnvUtils.get THROWS on undefined vars unless a default is passed — the
    // old `|| "admin"` fallbacks were dead code (the throw fired first).
    [EnvUtils.get("BULL_BOARD_USER", "admin")]: EnvUtils.get("BULL_BOARD_PASSWORD", "admin"),
  },
  challenge: true,
});

app.use("/admin/queues", basicAuthMiddleware, serverAdapter.getRouter());

// True 404 logger — MUST stay after every route mount (TSOA, chat, swagger,
// Bull Board). It used to sit before Bull Board, which made every normal
// panel poll log a false "No route matched" warning.
app.use((req, res, next) => {
  console.warn(`No route matched: ${req.method} ${req.path}`);
  next();
});

// Custom error handler to catch TSOA and Auth errors cleanly without stack traces or Sentry pollution
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error && err.name === "ValidateError") {
    const fields = (err as Error & { fields?: unknown }).fields;
    console.warn(`Caught Validation Error for ${req.path}:`, fields);
    res.status(422).json({
      message: "Validation Failed",
      details: fields,
    });
    return;
  }

  // SubscriptionRequiredError carries status=402 + a structured payload.
  if (err instanceof Error && err.name === "SubscriptionRequiredError") {
    const subErr = err as Error & { status: number; code: string; reason: string };
    console.warn(`[guard] 402 Subscription Required for ${req.path}: ${subErr.reason}`);
    res
      .status(subErr.status)
      .json({ code: subErr.code, message: subErr.message, reason: subErr.reason });
    return;
  }

  // UsageLimitExceededError carries status=429 + a structured payload.
  if (err instanceof Error && err.name === "UsageLimitExceededError") {
    const limitErr = err as Error & {
      status: number;
      code: string;
      limitType: string;
      used: number;
      allowed: number;
    };
    console.warn(
      `[usage-limit] 429 for ${req.path}: ${limitErr.limitType} ${limitErr.used}/${limitErr.allowed}`,
    );
    res.status(limitErr.status).json({
      code: limitErr.code,
      message: limitErr.message,
      limitType: limitErr.limitType,
      used: limitErr.used,
      allowed: limitErr.allowed,
    });
    return;
  }

  if (err instanceof Error && "status" in err) {
    const status = (err as Error & { status: number }).status;
    res.status(status).json({ message: err.message });
    return;
  }

  // Handle plain object errors thrown by BaseWorkspaceController (e.g. { status: 400, message: "..." })
  if (
    typeof err === "object" &&
    err !== null &&
    !Array.isArray(err) &&
    "status" in err &&
    "message" in err
  ) {
    const errObj = err as { status: number; message: string };
    console.warn(`[Controller Error] ${errObj.status}: ${errObj.message}`);
    res.status(errObj.status).json({ message: errObj.message });
    return;
  }

  next(err); // Pass everything else down (e.g., to Sentry and Express default handler)
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async () => {
  try {
    await initializeContextVectorStore();
    logger.info("Qdrant context collection verified.");
  } catch (error) {
    logger.error("Failed to initialize Qdrant context collection", error);
    process.exit(1);
  }

  try {
    const job = await pricingSyncQueue.add(
      "sync-models",
      {},
      {
        repeat: { pattern: "0 * * * *" },
      },
    );
    logger.info(`Scheduled OpenRouter pricing sync job: ${job.id}`);
  } catch (error) {
    logger.error("Failed to schedule pricing sync job", error);
  }

  try {
    // Mondays at 08:00 server time. `jobId` is fixed so restarting the server
    // re-uses the same repeatable job instead of stacking a new schedule on
    // every deploy (which would send the digest N times).
    const digestJob = await weeklyDigestQueue.add(
      "weekly-digest",
      {},
      { repeat: { pattern: "0 8 * * 1" }, jobId: "weekly-digest-cron" },
    );
    logger.info(`Scheduled weekly digest job: ${digestJob.id}`);
  } catch (error) {
    logger.error("Failed to schedule weekly digest job", error);
  }

  // Initialize in-memory pricing cache
  await pricingCacheService.init();

  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
    console.log("Healthcheck available at http://localhost:8080/api/healthcheck/status");
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`Qdrant dashboard at ${QDRANT_URL}/dashboard`);
  });

  // Explicitly set high timeouts for long-running AI generation requests (5 minutes)
  server.timeout = 300000;
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 301000;

  // Bind WebSocket server after the HTTP server starts listening
  setupAudioStream(server);
};

void startServer();

// Handle graceful shutdown
const closeServer = async (cb?: () => void) => {
  logger.info("Closing background workers...");
  await githubContextWorker.close();
  await pricingSyncWorker.close();
  await transcriptGenerationWorker.close();
  await taskRefinementWorker.close();
  await contextDocumentWorker.close();
  await weeklyDigestWorker.close();
  pricingCacheService.close();

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed");
      if (cb) cb();
    });
  } else {
    if (cb) cb();
  }
};

// nodemon restart signal
process.once("SIGUSR2", () => {
  logger.info("SIGUSR2 signal received: nodemon restart");
  closeServer(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  closeServer(() => process.exit(0));
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  closeServer(() => process.exit(0));
});

// Catch unhandled Promise rejections and exceptions that might silently kill tasks
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { promise, reason });
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  console.error("UNCAUGHT EXCEPTION:", error);
});
