const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true }, // Google Meet Link
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String, required: true }, 
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // List of Users invited
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  type: { type: String, default: 'Meeting' },
  color: { type: String, default: '#9C27B0' } // Purple
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);