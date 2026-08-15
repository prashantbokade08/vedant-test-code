import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import webpush from "web-push";
import Subscription from "./models/Subscription.js";
import Todo from "./models/Todo.js";

const KEYS_FILE = path.resolve(".mongo-data/vapid.json");

function loadVapidKeys() {
  // Prefer explicit env vars in production or when provided
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) {
    return { publicKey: process.env.VAPID_PUBLIC, privateKey: process.env.VAPID_PRIVATE };
  }

  // If a key file exists (useful for development), load it
  if (existsSync(KEYS_FILE)) {
    return JSON.parse(readFileSync(KEYS_FILE, "utf8"));
  }

  // In production, require keys via env to avoid writing secrets to disk
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing VAPID keys. Set VAPID_PUBLIC and VAPID_PRIVATE in environment.");
  }

  // Dev fallback: generate and persist keys locally
  const keys = webpush.generateVAPIDKeys();
  mkdirSync(path.dirname(KEYS_FILE), { recursive: true });
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
  return keys;
}

const vapidKeys = loadVapidKeys();
webpush.setVapidDetails(
  "mailto:admin@todo.local",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export function getPublicKey() {
  return vapidKeys.publicKey;
}

export async function sendToAll(title, body, url = "/") {
  const subs = await Subscription.find();
  if (subs.length === 0) return;
  const payload = JSON.stringify({ title, body, url, tag: "todo-reminder" });
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
        payload
      );
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await Subscription.deleteOne({ endpoint: s.endpoint });
        console.log("Removed expired push subscription");
      } else {
        console.error("Push send failed:", err.message);
      }
    }
  }
}

export function startReminderScheduler(intervalMs = 30_000) {
  return setInterval(async () => {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const due = await Todo.find({
        completed: false,
        reminderFired: false,
        remindAt: { $ne: null, $lte: now, $gte: cutoff },
      });
      for (const todo of due) {
        await sendToAll("⏰ Todo reminder", todo.title);
        todo.reminderFired = true;
        await todo.save();
      }
    } catch (err) {
      console.error("Reminder scheduler error:", err.message);
    }
  }, intervalMs);
}