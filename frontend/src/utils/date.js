export const IST = "Asia/Kolkata";

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: IST,
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: IST,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLongDateTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: IST,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function startOfDayIST(date = new Date()) {
  const s = new Date(date.toLocaleString("en-US", { timeZone: IST }));
  s.setHours(0, 0, 0, 0);
  return s;
}

export function isOverdue(todo) {
  return (
    !todo.completed &&
    todo.dueDate &&
    new Date(todo.dueDate) < startOfDayIST()
  );
}

export function isDueToday(todo) {
  if (todo.completed || !todo.dueDate) return false;
  const d = new Date(todo.dueDate);
  const today = startOfDayIST();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d >= today && d < tomorrow;
}

export function istToUtcISO(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const utc = Date.UTC(y, m - 1, d, hh, mm) - 5.5 * 60 * 60 * 1000;
  return new Date(utc).toISOString();
}