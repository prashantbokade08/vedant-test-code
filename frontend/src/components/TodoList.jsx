import TodoItem from "./TodoItem.jsx";

export default function TodoList({ todos, loading, onToggle, onSave, onDelete }) {
  if (loading) return <p className="status">Loading todos...</p>;
  if (todos.length === 0) return <p className="status">No todos yet. Add one above!</p>;

  const sorted = [...todos].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    const priorityDiff = (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <ul className="todo-list">
      {sorted.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          onToggle={onToggle}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}