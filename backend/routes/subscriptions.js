import { Router } from "express";
import Subscription from "../models/Subscription.js";
import { getPublicKey } from "../push.js";

const router = Router();

router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

router.post("/", async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    await Subscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: req.get("user-agent") || "unknown",
      },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    await Subscription.deleteOne({ endpoint: req.body.endpoint });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;