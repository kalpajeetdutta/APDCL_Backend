const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true }, 
  date: { type: String, required: true }, // "YYYY-MM-DD"
  
  // ✅ CHANGED: Explicit Start and End Times
  startTime: { type: String, required: true }, // e.g., "10:30 AM"
  endTime: { type: String, required: true },   // e.g., "11:30 AM"
  
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  type: { type: String, default: 'Meeting' },
  color: { type: String, default: '#9C27B0' } 
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);