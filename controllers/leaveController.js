const Leave = require('../models/Leave');
const User = require('../models/User');

// POST /api/leave/apply
const applyLeave = async (req, res) => {
  try {
    const { userId, startDate, endDate, reason } = req.body;

    // 1. Find the User
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Create the Leave Document
    const newLeave = new Leave({
      user: userId,
      userName: user.name,
      startDate,
      endDate,
      reason
    });
    const savedLeave = await newLeave.save();

    // 3. Update User: Add to leave array & Update Status
    // Note: In a real app, you'd only change status if the leave starts TODAY.
    // For this requirement, we'll update it immediately or based on logic.
    user.leaves.push(savedLeave._id);
    
    // Simple logic: If leave starts now/today, set status to 'On Leave'
    const start = new Date(startDate);
    const now = new Date();
    if (start <= now) {
        user.currentStatus = 'On Leave';
    }

    await user.save();

    res.status(201).json({ message: "Leave applied successfully", leave: savedLeave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// NEW: GET /api/leave/status/:userId
const getLatestLeave = async (req, res) => {
  try {
    // console.log("User params:", req.params);
    const { userId } = req.params;

    // Find the most recently created leave for this user
    const latestLeave = await Leave.findOne({ user: userId })
                                   .sort({ createdAt: -1 }); // Newest first

    if (!latestLeave) {
      return res.status(200).json(null); // No leaves ever applied
    }

    res.status(200).json(latestLeave);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // 1. Remove reference from User's 'leaves' array
    await User.findByIdAndUpdate(leave.user, {
      $pull: { leaves: leaveId }
    });

    // 2. Delete the Leave Document
    await leave.deleteOne();

    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { applyLeave, getLatestLeave, deleteLeave };