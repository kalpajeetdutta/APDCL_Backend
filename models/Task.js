const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  }, // YYYY-MM-DD (Acts as Deadline)
  
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

  // --- NEW FIELDS FOR OFFICIAL TASKS ---
  type: {
    type: String,
    enum: ['Personal Task', 'Official Task'], 
    default: 'Personal Task'
  },
  
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  }, // The person who CREATED the task
  
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  } // The person assigned to DO the task
}, { timestamps: true }); // Each task gets its own createdAt/updatedAt

module.exports = TaskSchema;