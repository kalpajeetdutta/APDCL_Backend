const Notification = require('../models/Notification');
const sendBroadcast = require('../utils/sendBroadcast');

// GET /api/notification/:userId
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// PUT /api/notification/read/:userId/:notificationId
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/notification/read-all/:userId
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
    res.status(200).json({ message: "All read" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/notification/broadcast
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, date, time } = req.body;

    // 1. Append Date/Time to the message body for clarity
    let finalMessage = message;
    if (date || time) {
        finalMessage += `\n\n📅 ${date || ''} ${time ? '• ' + time : ''}`;
    }

    // 2. Call your existing utility
    // It already fetches all users and inserts notifications/sends FCM
    await sendBroadcast(
        title, 
        finalMessage, 
        { type: type } // Pass 'Notice' or 'Message' as type
    );

    res.status(200).json({ message: "Broadcast sent successfully" });

  } catch (error) {
    console.error("Broadcast Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead, broadcastNotification };