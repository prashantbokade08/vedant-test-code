import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import todoRoutes from "./routes/todos.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import { startReminderScheduler } from "./push.js";

const app = express();

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";

// ============================================================
// CORS
// ============================================================

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // Example: curl, health checks, internal requests
      if (!origin) {
        return callback(null, true);
      }

      // If CORS_ORIGINS is not configured,
      // allow all origins.
      if (!allowedOrigins || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

// ============================================================
// Security middleware
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ============================================================
// Request parsing
// ============================================================

app.use(
  express.json({
    limit: "10kb",
  })
);

// ============================================================
// MongoDB sanitization
// ============================================================

app.use(mongoSanitize());

// ============================================================
// Rate limiting
// ============================================================

const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 100);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "todo-backend",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// Root API endpoint
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "MERN Todo API is running",
    service: "todo-backend",
    endpoints: {
      todos: "/api/todos",
      subscriptions: "/api/subscriptions",
      health: "/health",
    },
  });
});

// ============================================================
// API routes
// ============================================================

app.use("/api/todos", todoRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

// ============================================================
// 404 handler
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
  });
});

// ============================================================
// Global error handler
// ============================================================

app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);

  if (err.message === "CORS origin not allowed") {
    return res.status(403).json({
      error: "CORS origin not allowed",
    });
  }

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// ============================================================
// Start server
// ============================================================

async function startServer(uri = process.env.MONGO_URI) {
  if (!uri) {
    console.error("MONGO_URI environment variable is not configured.");
    process.exit(1);
  }

  try {
    // ----------------------------------------------------------
    // MongoDB connection
    // ----------------------------------------------------------

    await mongoose.connect(uri);

    console.log("Connected to MongoDB");

    // ----------------------------------------------------------
    // Start HTTP server
    // ----------------------------------------------------------

    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);

      // --------------------------------------------------------
      // Start reminder scheduler
      // --------------------------------------------------------

      try {
        const scheduler = startReminderScheduler();

        console.log(
          "Reminder scheduler started (checks every 30s)"
        );

        // ------------------------------------------------------
        // Graceful shutdown
        // ------------------------------------------------------

        const shutdown = async (signal) => {
          console.log(`Received ${signal}, shutting down...`);

          clearInterval(scheduler);

          server.close(async () => {
            try {
              await mongoose.disconnect();

              console.log("MongoDB disconnected");
              console.log("Server shutdown complete");

              process.exit(0);
            } catch (error) {
              console.error(
                "Error during MongoDB shutdown:",
                error
              );

              process.exit(1);
            }
          });
        };

        process.on("SIGINT", () => {
          shutdown("SIGINT");
        });

        process.on("SIGTERM", () => {
          shutdown("SIGTERM");
        });
      } catch (error) {
        console.error(
          "Failed to start reminder scheduler:",
          error
        );

        process.exit(1);
      }
    });

    // ----------------------------------------------------------
    // Handle server errors
    // ----------------------------------------------------------

    server.on("error", (error) => {
      console.error("HTTP server error:", error);

      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use.`
        );
      }

      process.exit(1);
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
}

// ============================================================
// Start application
// ============================================================

startServer();

export { app, startServer };