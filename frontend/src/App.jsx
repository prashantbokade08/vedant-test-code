import { useEffect, useMemo, useState } from "react";
import TodoForm from "./components/TodoForm.jsx";
import TodoList from "./components/TodoList.jsx";
import AlarmBanner from "./components/AlarmBanner.jsx";
import { useAlarm } from "./hooks/useAlarm.js";
import { usePush } from "./hooks/usePush.js";
import { TONE_OPTIONS, playTone } from "./utils/sounds.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const API = `${API_BASE}/api/todos`;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("completed", filter === "completed");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error("Failed to load todos");
      setTodos(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter, search]);

  const addTodo = async (title, priority, dueDate, remindAt) => {
    try {
      setError("");
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, dueDate, remindAt }),
      });
      if (!res.ok) throw new Error("Failed to add todo");
      const todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      setError("");
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      const updated = await res.json();
      setTodos((prev) =>
        prev
          .map((t) => (t._id === id ? updated : t))
          .filter((t) =>
            filter === "all"
              ? true
              : t.completed === (filter === "completed")
          )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      setError("");
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete todo");
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCompleted = async () => {
    try {
      setError("");
      const res = await fetch(`${API}/completed`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear completed");
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      setError(err.message);
    }
  };

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    return { total, completed, pending: total - completed };
  }, [todos]);

  const hasCompleted = todos.some((t) => t.completed);

  const [sound, setSound] = useState(
    () => localStorage.getItem("alarmSound") !== "off"
  );

  const [tone, setTone] = useState(
    () => localStorage.getItem("alarmTone") || "digital"
  );

  const changeTone = (value) => {
    setTone(value);
    localStorage.setItem("alarmTone", value);
  };

  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleSound = () => {
    setSound((prev) => {
      const next = !prev;
      localStorage.setItem("alarmSound", next ? "on" : "off");
      return next;
    });
  };

  const { active, dismiss, snooze } = useAlarm(
    todos,
    (id) => updateTodo(id, { reminderFired: true }),
    sound,
    (id) =>
      updateTodo(id, {
        remindAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        reminderFired: false,
      }),
    tone
  );

  const push = usePush();

  return (
    <div className="app">
      <h1>✅ MERN Todo App</h1>
      <div className="settings">
        {push.status === "default" && (
          <button
            className="notif-button"
            onClick={() => push.subscribe().catch(() => {})}
          >
            🔔 Enable reminders on this device
          </button>
        )}
        {push.status === "subscribed" && (
          <button className="notif-button subscribed" onClick={push.unsubscribe}>
            🔕 Reminders on
          </button>
        )}
        {push.status === "denied" && (
          <span className="settings-note">
            Notifications blocked - allow them in browser settings
          </span>
        )}
        <div className="sound-control">
          <button
            className={`notif-button sound ${sound ? "" : "muted"}`}
            onClick={toggleSound}
            title="Toggle alarm sound"
          >
            {sound ? "🔊" : "🔇"}
          </button>
          <select
            className="tone-select"
            value={tone}
            onChange={(e) => changeTone(e.target.value)}
            title="Alarm tone"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            className="notif-button sound"
            onClick={() => playTone(tone)}
            title="Test alarm tone"
          >
            ▶ Test
          </button>
        </div>
        <button
          className="notif-button sound"
          onClick={() => setDark((d) => !d)}
          title="Toggle dark mode"
        >
          {dark ? "🌙" : "☀️"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="stats">
        <div className="stat-card stat-total">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card stat-pending">
          <span className="stat-num">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card stat-done">
          <span className="stat-num">{stats.completed}</span>
          <span className="stat-label">Done</span>
        </div>
        {stats.total > 0 && (
          <div className="progress" title={`${Math.round((stats.completed / stats.total) * 100)}% complete`}>
            <div
              className="progress-bar"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>
      <TodoForm onAdd={addTodo} />
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search todos..."
        />
        <div className="filters">
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {hasCompleted && (
          <button className="clear-completed" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </div>
      <TodoList
        todos={todos}
        loading={loading}
        onToggle={(id, completed) => updateTodo(id, { completed: !completed })}
        onSave={(id, title) => updateTodo(id, { title })}
        onDelete={deleteTodo}
      />
      <AlarmBanner alarms={active} onDismiss={dismiss} onSnooze={snooze} />
    </div>
  );
}