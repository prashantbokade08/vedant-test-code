import { useState } from "react";
import { formatDate, formatDateTime, isDueToday, isOverdue } from "../utils/date.js";

export default function TodoItem({ todo, onToggle, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== todo.title) onSave(todo._id, trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTitle(todo.title);
      setEditing(false);
    }
  };

  const overdue = isOverdue(todo);
  const dueToday = isDueToday(todo);

  return (
    <li
      className={
        [
          "todo",
          todo.completed ? "completed" : "",
          overdue ? "overdue" : "",
          `priority-${todo.priority}`,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo._id, todo.completed)}
      />
      <span className={`avatar ${todo.priority}`}>
        {todo.priority[0].toUpperCase()}
      </span>
      {editing ? (
        <input
          className="edit-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span className="todo-title" onDoubleClick={() => setEditing(true)}>
          {todo.title}
        </span>
      )}
      {todo.dueDate && (
        <span
          className={`due-date ${overdue ? "overdue" : ""} ${
            dueToday && !todo.completed ? "due-today" : ""
          }`}
          title={`Due ${formatLong(todo.dueDate)} IST`}
        >
          {overdue ? "⚠ " : "📅 "}
          {formatDate(todo.dueDate)} IST
          {dueToday && " (today)"}
        </span>
      )}
      {todo.remindAt && (
        <button
          className="remind-chip"
          title={`Reminder at ${formatLong(todo.remindAt)} IST - click to remove`}
          onClick={() => onSave(todo._id, { remindAt: null })}
        >
          🔔 {formatDateTime(todo.remindAt)} IST{" "}
          <span className="remind-x">✕</span>
        </button>
      )}
      <div className="actions">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button className="delete" onClick={() => onDelete(todo._id)}>
          Delete
        </button>
      </div>
    </li>
  );
}

function formatLong(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}