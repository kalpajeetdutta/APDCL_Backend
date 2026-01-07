const admin = require('../config/firebase');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendBroadcast = async (title, body, data = {}) => {
  try {
    const users = await User.find({});
    if (users.length === 0) return;

    // 1. Bulk Save to MongoDB
    const notifDocs = users.map(u => ({
        recipient: u._id,
        title: title,
        message: body,
        type: data.type || 'Alert',
        relatedId: data.eventId || null,
        isRead: false
    }));

    await Notification.insertMany(notifDocs);

    // 2. Send via Firebase (Only to users with tokens)
    const validUsers = users.filter(u => u.fcmToken);
    
    if (validUsers.length > 0) {
        const tokens = validUsers.map(u => u.fcmToken);
        const message = {
            notification: { title, body },
            data: data,
            tokens: tokens, // Note plural 'tokens'
            android: { 
                priority: 'high',
                notification: { channelId: 'default' } 
            }
        };
        await admin.messaging().sendEachForMulticast(message);
    }
    console.log(`📢 Broadcast saved & sent to ${validUsers.length} devices.`);

  } catch (error) {
    console.error("❌ Broadcast Error:", error);
  }
};

module.exports = sendBroadcast;