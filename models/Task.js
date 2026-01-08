const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  }, // YYYY-MM-DD (Deadline)
  
  time: { 
    type: String 
  }, // HH:MM AM/PM
  
  description: { 
    type: String 
  },
  
  isCompleted: { 
    type: Boolean, 
    default: false 
  },
  
  color: { 
    type: String, 
    default: '#2196F3' 
  },

  type: {
    type: String,
    enum: ['Personal Task', 'Official Task'], 
    default: 'Personal Task'
  },
  
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  }, 
  
  // ✅ CHANGED: Now accepts multiple users
  assignedTo: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }] 
}, { timestamps: true });

module.exports = TaskSchema;