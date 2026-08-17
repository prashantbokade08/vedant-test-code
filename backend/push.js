import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import webpush from "web-push";

import Subscription from "./models/Subscription.js";
import Todo from "./models/Todo.js";

// ============================================================
// Configuration
// ============================================================

const KEYS_FILE = path.resolve(".mongo-data/vapid.json");

const VAPID_PUBLIC = process.env.VAPID_PUBLIC?.trim();
const VAPID_PRIVATE = process.env.VAPID_PRIVATE?.trim();

const VAPID_EMAIL =
  process.env.VAPID_EMAIL?.trim() || "mailto:admin@todo.local";

// ============================================================
// VAPID state
// ============================================================

let vapidKeys = null;
let pushEnabled = false;

// ============================================================
// Load VAPID keys
// ============================================================

function loadVapidKeys() {
  // ----------------------------------------------------------
  // Production / Kubernetes
  //
  // Prefer Kubernetes Secret / environment variables.
  // ----------------------------------------------------------

  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    console.log("VAPID keys loaded from environment variables.");

    return {
      publicKey: VAPID_PUBLIC,
      privateKey: VAPID_PRIVATE,
    };
  }

  // ----------------------------------------------------------
  // Development
  //
  // If a local VAPID key file exists, use it.
  // ----------------------------------------------------------

  if (existsSync(KEYS_FILE)) {
    try {
      const storedKeys = JSON.parse(
        readFileSync(KEYS_FILE, "utf8")
      );

      if (
        storedKeys?.publicKey &&
        storedKeys?.privateKey
      ) {
        console.log("VAPID keys loaded from local key file.");

        return {
          publicKey: storedKeys.publicKey,
          privateKey: storedKeys.privateKey,
        };
      }

      console.warn(
        "VAPID key file exists but contains invalid keys."
      );
    } catch (error) {
      console.error(
        "Failed to read VAPID key file:",
        error.message
      );
    }
  }

  // ----------------------------------------------------------
  // Production without VAPID keys
  //
  // Do NOT crash the backend.
  //
  // Push notifications will simply be disabled until:
  //
  // VAPID_PUBLIC
  // VAPID_PRIVATE
  //
  // are provided through Kubernetes Secret.
  // ----------------------------------------------------------

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "WARNING: VAPID_PUBLIC and VAPID_PRIVATE are not configured."
    );

    console.warn(
      "Push notifications are disabled."
    );

    console.warn(
      "Add VAPID_PUBLIC and VAPID_PRIVATE to the Kubernetes Secret to enable push notifications."
    );

    return null;
  }

  // ----------------------------------------------------------
  // Development fallback
  //
  // Generate keys automatically for local development.
  // ----------------------------------------------------------

  try {
    console.log(
      "Generating VAPID keys for development..."
    );

    const keys = webpush.generateVAPIDKeys();

    mkdirSync(path.dirname(KEYS_FILE), {
      recursive: true,
    });

    writeFileSync(
      KEYS_FILE,
      JSON.stringify(keys, null, 2),
      "utf8"
    );

    console.log(
      `Development VAPID keys saved to ${KEYS_FILE}`
    );

    return keys;
  } catch (error) {
    console.error(
      "Failed to generate VAPID keys:",
      error.message
    );

    return null;
  }
}

// ============================================================
// Initialize VAPID
// ============================================================

try {
  vapidKeys = loadVapidKeys();

  if (
    vapidKeys?.publicKey &&
    vapidKeys?.privateKey
  ) {
    webpush.setVapidDetails(
      VAPID_EMAIL,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    pushEnabled = true;

    console.log("Web Push notifications enabled.");
  } else {
    pushEnabled = false;

    console.warn(
      "Web Push notifications are disabled."
    );
  }
} catch (error) {
  pushEnabled = false;

  console.error(
    "VAPID initialization failed:",
    error.message
  );

  console.warn(
    "Backend will continue running without push notifications."
  );
}

// ============================================================
// Public VAPID key
// ============================================================

export function getPublicKey() {
  if (!pushEnabled || !vapidKeys?.publicKey) {
    return null;
  }

  return vapidKeys.publicKey;
}

// ============================================================
// Send notification to all subscriptions
// ============================================================

export async function sendToAll(
  title,
  body,
  url = "/"
) {
  // ----------------------------------------------------------
  // Push disabled
  // ----------------------------------------------------------

  if (!pushEnabled) {
    console.warn(
      "Push notification skipped because VAPID is not configured."
    );

    return;
  }

  try {
    const subscriptions = await Subscription.find();

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag: "todo-reminder",
    });

    for (const subscription of subscriptions) {
      try {
        // ----------------------------------------------------
        // Validate subscription
        // ----------------------------------------------------

        if (
          !subscription.endpoint ||
          !subscription.keys?.p256dh ||
          !subscription.keys?.auth
        ) {
          console.warn(
            "Skipping invalid push subscription."
          );

          continue;
        }

        // ----------------------------------------------------
        // Send notification
        // ----------------------------------------------------

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload
        );
      } catch (error) {
        // ----------------------------------------------------
        // Subscription expired / no longer valid
        // ----------------------------------------------------

        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          try {
            await Subscription.deleteOne({
              endpoint: subscription.endpoint,
            });

            console.log(
              "Removed expired push subscription."
            );
          } catch (deleteError) {
            console.error(
              "Failed to remove expired subscription:",
              deleteError.message
            );
          }
        } else {
          console.error(
            "Push notification failed:",
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "Failed to load push subscriptions:",
      error.message
    );
  }
}

// ============================================================
// Reminder scheduler
// ============================================================

export function startReminderScheduler(
  intervalMs = 30_000
) {
  console.log(
    `Reminder scheduler configured with ${intervalMs / 1000}s interval.`
  );

  const runReminderCheck = async () => {
    try {
      const now = new Date();

      const cutoff = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      );

      // ------------------------------------------------------
      // Find pending reminders
      // ------------------------------------------------------

      const dueTodos = await Todo.find({
        completed: false,
        reminderFired: false,
        remindAt: {
          $ne: null,
          $lte: now,
          $gte: cutoff,
        },
      });

      if (!dueTodos || dueTodos.length === 0) {
        return;
      }

      console.log(
        `Found ${dueTodos.length} due reminder(s).`
      );

      // ------------------------------------------------------
      // Process reminders
      // ------------------------------------------------------

      for (const todo of dueTodos) {
        try {
          await sendToAll(
            "⏰ Todo reminder",
            todo.title
          );

          todo.reminderFired = true;

          await todo.save();

          console.log(
            `Reminder processed for todo: ${todo._id}`
          );
        } catch (error) {
          console.error(
            `Failed to process reminder for todo ${todo._id}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Reminder scheduler error:",
        error.message
      );
    }
  };

  // ----------------------------------------------------------
  // Run first check immediately
  // ----------------------------------------------------------

  runReminderCheck().catch((error) => {
    console.error(
      "Initial reminder check failed:",
      error.message
    );
  });

  // ----------------------------------------------------------
  // Run periodically
  // ----------------------------------------------------------

  return setInterval(
    runReminderCheck,
    intervalMs
  );
}