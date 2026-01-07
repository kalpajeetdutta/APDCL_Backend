const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // ✅ Optimizes query speed
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Meeting', 'Task', 'Holiday', 'Event', 'General'],
    default: 'General'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, 
    default: null // Links to Meeting/Task ID if needed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: '30d' // ✅ Auto-deletes notifications older than 30 days
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);