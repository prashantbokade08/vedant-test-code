import { useCallback, useEffect, useRef, useState } from "react";
import { playTone } from "../utils/sounds.js";

export function useAlarm(todos, onMarkFired, soundEnabled = true, onSnooze, tone = "digital") {
  const [active, setActive] = useState([]);
  const firedRef = useRef(new Set());

  useEffect(() => {
    const now = Date.now();
    const due = todos.filter(
      (t) =>
        !t.completed &&
        t.remindAt &&
        !t.reminderFired &&
        !firedRef.current.has(t._id) &&
        new Date(t.remindAt).getTime() <= now
    );
    if (due.length === 0) return;
    due.forEach((t) => firedRef.current.add(t._id));
    setActive((prev) => [...prev, ...due]);
    if (soundEnabled) playTone(tone);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      due.forEach((t) =>
        new Notification("⏰ Todo reminder", { body: t.title })
      );
    }
  }, [todos, soundEnabled, tone]);

  const dismiss = useCallback(
    (id) => {
      setActive((prev) => prev.filter((a) => a._id !== id));
      onMarkFired(id);
    },
    [onMarkFired]
  );

  const snooze = useCallback(
    (id, minutes = 5) => {
      firedRef.current.delete(id);
      setActive((prev) => prev.filter((a) => a._id !== id));
      if (onSnooze) onSnooze(id, minutes);
    },
    [onSnooze]
  );

  return { active, dismiss, snooze };
}