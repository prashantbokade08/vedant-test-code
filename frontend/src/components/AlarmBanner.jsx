import { formatDate } from "../utils/date.js";

export default function AlarmBanner({ alarms, onDismiss, onSnooze }) {
  if (alarms.length === 0) return null;

  return (
    <div className="alarm-banner">
      {alarms.map((a) => (
        <div key={a._id} className="alarm">
          <span className="alarm-title">
            ⏰ {a.title}
            {a.dueDate && <small> due {formatDate(a.dueDate)} IST</small>}
          </span>
          <div className="alarm-actions">
            {onSnooze && (
              <button className="alarm-snooze" onClick={() => onSnooze(a._id)}>
                Snooze 5m
              </button>
            )}
            <button className="alarm-dismiss" onClick={() => onDismiss(a._id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}