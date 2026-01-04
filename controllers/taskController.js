const User = require('../models/User');
const mongoose = require('mongoose');

// DELETE /api/task/delete/:userId/:taskId
const deleteTask = async (req, res) => {
  try {
    const { userId, taskId } = req.params;

    // 1. Find the HOST User
    const hostUser = await User.findById(userId);
    if (!hostUser) return res.status(404).json({ message: "User not found" });

    // 2. Find the Task in Host's list
    const taskToDelete = hostUser.tasks.id(taskId);
    if (!taskToDelete) return res.status(404).json({ message: "Task not found" });

    // Capture details before deleting
    const isOfficial = taskToDelete.type.includes('Official');
    const assignedUserId = taskToDelete.assignedTo;
    const taskTitle = taskToDelete.title;

    // 3. Delete from HOST
    // We use .pull() method on the MongooseArray, then save()
    // This is often more reliable than findOneAndUpdate for subdocs
    hostUser.tasks.pull(taskId);
    await hostUser.save();

    console.log(`Deleted task '${taskTitle}' from Host.`);

    // 4. If OFFICIAL TASK & has Assignee: Remove from Assignee's list manually
    if (isOfficial && assignedUserId) {
        
        // A. Find the Assignee
        const assigneeUser = await User.findById(assignedUserId);
        
        if (assigneeUser) {
            // B. Find the matching task index manually
            // We look for a task where:
            // 1. Title matches
            // 2. Host matches the Requesting User ID
            const taskIndex = assigneeUser.tasks.findIndex(t => 
                t.title === taskTitle && 
                t.host && 
                t.host.toString() === userId // Compare IDs as strings to be safe
            );

            if (taskIndex > -1) {
                // C. Remove it
                assigneeUser.tasks.splice(taskIndex, 1);
                await assigneeUser.save();
                console.log(`Successfully removed task from Assignee ${assigneeUser.name}`);
            } else {
                console.log("Could not find matching task in Assignee's list (Already deleted?)");
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

    // Find users by name or email (case insensitive)
    // Exclude the current user if needed (logic can be added on frontend)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email role department'); // Only return necessary fields

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};

// POST /api/task/add
const addTask = async (req, res) => {
  try {
    const { userId, title, date, time, description, color, type, assignedTo } = req.body;

    // 1. Prepare the Task Object
    // For Official tasks, 'date' is treated as deadline
    const fullType = type.includes('Task') ? type : `${type} Task`;
    const newTask = {
      title,
      date, // This acts as Deadline
      time,
      description,
      type: fullType,
      color: color || '#2196F3',
      isCompleted: false,
      host: userId, // The creator
      assignedTo: assignedTo || null // The assignee (if Official)
    };

    // 2. Add to HOST (Creator)
    const hostUser = await User.findByIdAndUpdate(
      userId,
      { $push: { tasks: newTask } },
      { new: true }
    );

    // 3. If OFFICIAL, Add to ASSIGNEE (The other person)
    if (type === 'Official' && assignedTo) {
        // Create a copy for the assignee, marking who assigned it
        const assigneeTask = {
            ...newTask,
            description: `[Assigned by ${hostUser.name}] ${description}`, // context
            type: 'Official'
        };

        await User.findByIdAndUpdate(
            assignedTo,
            { $push: { tasks: assigneeTask } }
        );
    }

    if (!hostUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(201).json({ message: "Task created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/// GET /api/task/:userId
const getUserTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Find User and Populate Tasks details
    const user = await User.findById(userId)
      .select('tasks')
      .populate({
         path: 'tasks.assignedTo', // Important for Official Tasks
         select: 'name email'
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Return the FLAT array (Frontend expects Array, not Object)
    res.status(200).json(user.tasks);

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// PUT /api/task/toggle/:userId/:taskId
const toggleTaskStatus = async (req, res) => {
  try {
    const { userId, taskId } = req.params;

    // 1. Find the User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Find the specific Task Subdocument
    const task = user.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 3. Toggle the boolean value
    task.isCompleted = !task.isCompleted;

    // 4. Save the Parent Document (User)
    await user.save();

    res.status(200).json({ 
      message: "Task updated successfully", 
      updatedTask: task 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { searchUsers, addTask, getUserTasks, toggleTaskStatus, deleteTask };