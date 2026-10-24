const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

// All routes below require authentication (applied in index.js)

// ──────────────────────────────────────────────
// GET /api/tasks — list the signed-in user's tasks
// ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err.message);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});

// ──────────────────────────────────────────────
// POST /api/tasks — create a new task
// ──────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description, subject, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    // Validate priority if provided
    if (priority && !["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ message: "Priority must be Low, Medium or High." });
    }

    const task = await Task.create({
      title,
      description: description || "",
      subject: subject || "",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      owner: req.userId,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err.message);
    res.status(500).json({ message: "Failed to create task." });
  }
});

// ──────────────────────────────────────────────
// PUT /api/tasks/:id — update a task
// ──────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    // Find the task and make sure it belongs to the signed-in user
    const task = await Task.findOne({ _id: req.params.id, owner: req.userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Validate priority if provided
    if (req.body.priority && !["Low", "Medium", "High"].includes(req.body.priority)) {
      return res.status(400).json({ message: "Priority must be Low, Medium or High." });
    }

    // Update only the fields that were sent
    const allowedFields = ["title", "description", "subject", "priority", "dueDate", "completed"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error("Update task error:", err.message);
    res.status(500).json({ message: "Failed to update task." });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/tasks/:id — delete a task
// ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("Delete task error:", err.message);
    res.status(500).json({ message: "Failed to delete task." });
  }
});

module.exports = router;
