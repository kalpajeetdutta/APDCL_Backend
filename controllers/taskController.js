const User = require('../models/User');
const mongoose = require('mongoose');

// DELETE /api/task/delete/:userId/:taskId
const deleteTask = async (req, res) => {
  try {
    const { userId, taskId } = req.params;

    // 1. Find Host
    const hostUser = await User.findById(userId);
    if (!hostUser) return res.status(404).json({ message: "User not found" });

    // 2. Find Task
    const taskToDelete = hostUser.tasks.id(taskId);
    if (!taskToDelete) return res.status(404).json({ message: "Task not found" });

    const isOfficial = taskToDelete.type.includes('Official');
    const assignedUserIds = taskToDelete.assignedTo; // Now an Array
    const taskTitle = taskToDelete.title;

    // 3. Delete from Host
    hostUser.tasks.pull(taskId);
    await hostUser.save();

    // 4. If Official, Remove from ALL Assignees
    if (isOfficial && assignedUserIds && assignedUserIds.length > 0) {
        
        // Loop through each assignee
        for (const assigneeId of assignedUserIds) {
            const assigneeUser = await User.findById(assigneeId);
            if (assigneeUser) {
                // Find matching task by Title & Host ID
                const taskIndex = assigneeUser.tasks.findIndex(t => 
                    t.title === taskTitle && 
                    t.host && 
                    t.host.toString() === userId 
                );

                if (taskIndex > -1) {
                    assigneeUser.tasks.splice(taskIndex, 1);
                    await assigneeUser.save();
                }
            }
        }
    }

    res.status(200).json({ message: "Task deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/task/search-users?query=...
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email role department'); 

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};

// POST /api/task/add
const addTask = async (req, res) => {
  try {
    const { userId, title, date, time, description, color, type, assignedTo } = req.body;
    // assignedTo is now expected to be an Array of UserIDs e.g. ["id1", "id2"]

    const fullType = type.includes('Task') ? type : `${type} Task`;
    
    // 1. Base Task Object
    const newTask = {
      title,
      date, 
      time,
      description,
      type: fullType,
      color: color || '#2196F3',
      isCompleted: false,
      host: userId, 
      assignedTo: (type === 'Official' && Array.isArray(assignedTo)) ? assignedTo : [] 
    };

    // 2. Add to HOST
    const hostUser = await User.findByIdAndUpdate(
      userId,
      { $push: { tasks: newTask } },
      { new: true }
    );

    // 3. If OFFICIAL, Add to ALL ASSIGNEES
    if (type === 'Official' && Array.isArray(assignedTo) && assignedTo.length > 0) {
        
        const assigneeTask = {
            ...newTask,
            description: `[Assigned by ${hostUser.name}] ${description}`,
            type: 'Official Task'
        };

        // Use Promise.all for parallel updates
        await Promise.all(assignedTo.map(assigneeId => 
            User.findByIdAndUpdate(
                assigneeId,
                { $push: { tasks: assigneeTask } }
            )
        ));
    }

    if (!hostUser) return res.status(404).json({ message: "User not found" });

    res.status(201).json({ message: "Task created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// GET /api/task/:userId
const getUserTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('tasks')
      .populate({
         path: 'tasks.assignedTo', 
         select: 'name email'
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.tasks);

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// PUT /api/task/toggle/:userId/:taskId
const toggleTaskStatus = async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const task = user.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.isCompleted = !task.isCompleted;
    await user.save();

    res.status(200).json({ message: "Task updated", updatedTask: task });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { searchUsers, addTask, getUserTasks, toggleTaskStatus, deleteTask };