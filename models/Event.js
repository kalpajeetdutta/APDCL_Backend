const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String },                 // HH:MM AM/PM or 'All Day'
  startAllDay: { type: Boolean, default: true }, // ✅ NEW

  endDate: { type: String, required: true },   // YYYY-MM-DD
  endTime: { type: String },                   // HH:MM AM/PM or 'All Day'
  endAllDay: { type: Boolean, default: true },   // ✅ NEW

  type: { type: String, default: 'Event' }, 
  color: { type: String, default: '#607D8B' }, // ✅ Fixed Default Color
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  scope: { 
      type: String, 
      enum: ['Global', 'Private'], 
      default: 'Global' 
  },
  attendees: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);