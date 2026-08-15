import { Router } from "express";
import Todo from "../models/Todo.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const todo = await Todo.create(req.body);
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { completed, priority, search } = req.query;
    const filter = {};
    if (completed === "true" || completed === "false") {
      filter.completed = completed === "true";
    }
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: "i" };
    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/completed", async (req, res) => {
  try {
    const result = await Todo.deleteMany({ completed: true });
    res.json({ message: `${result.deletedCount} completed todos deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json({ message: "Todo deleted", id: req.params.id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;