const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String },                 // HH:MM AM/PM
  endDate: { type: String, required: true }, // YYYY-MM-DD
  endTime: { type: String },                 // <--- NEW: HH:MM AM/PM
  type: { type: String, default: 'Event' }, 
  color: { type: String, default: '#0A55C4' }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);