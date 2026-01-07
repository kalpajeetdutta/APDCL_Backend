const admin = require('../config/firebase');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Save to MongoDB
    const notifType = data.type || 'General';
    const relatedId = data.meetingId || data.taskId || data.eventId || null;

    await Notification.create({
        recipient: userId,
        title: title,
        message: body,
        type: notifType,
        relatedId: relatedId,
        isRead: false
    });

    // 2. Send via Firebase
    if (user.fcmToken) {
        const message = {
          notification: { title, body },
          data: data, // Custom data for navigation
          token: user.fcmToken,
          android: { 
            priority: 'high',
            notification: { channelId: 'default', sound: 'default' } 
          },
          apns: { 
             payload: { aps: { sound: 'default', contentAvailable: true } } 
          }
        };

        await admin.messaging().send(message);
        console.log(`✅ Notification sent & saved for ${user.name}`);
    }
  } catch (error) {
    console.error("❌ Notification Error:", error);
  }
};

module.exports = sendNotification;