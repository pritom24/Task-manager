const express = require("express");
const Task = require("../src/db/models/task");
const router = new express.Router();
const auth = require("../src/middleware/auth");

router.post("/tasks", auth, async (req, res) => {
  // const task = await Task(req.body);
  const task = await Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});
//tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  const sort = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      res.send("error");
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["description", "completed"];
  const isvalid = updates.every((update) => allowedUpdate.includes(update));
  if (!isvalid) {
    return res.status(400).send("invalid option");
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send("invalid update");
    }
    updates.forEach((update) => (task[updates] = req.body[update]));

    await task.save();
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/tasks/:id", auth, async (req, res) => {
  // const task = await Task.findByIdAndDelete(req.params.id, req.body);
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.id,
  });
  try {
    if (!task) {
      res.status(404).send("cant find to delete");
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
