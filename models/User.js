const mongoose = require('mongoose');
const TaskSchema = require('./Task');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  organizationID: { type: String, required: true, unique: true }, 
  role: { type: String, enum: ['Official', 'Admin'], default: 'Official' },
  currentStatus: { 
    type: String, 
    enum: ['Available', 'On Leave', 'In Meeting'], 
    default: 'Available' 
  },
  leaves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leave' }],
  tasks: [TaskSchema],
  // Actual Dates
  dob: { type: Date },
  joiningDate: { type: Date },

  // --- OPTIMIZATION FIELDS (Computed) ---
  // Allow instant lookup: User.find({ dobMonth: 12 })
  dobDay: { type: Number, index: true }, 
  dobMonth: { type: Number, index: true },
  
  joiningDay: { type: Number, index: true },
  joiningMonth: { type: Number, index: true },
}, { timestamps: true });

// Pre-save hook to populate the optimization fields automatically
UserSchema.pre('save', function() {
  if (this.dob) {
    this.dobDay = this.dob.getDate();
    this.dobMonth = this.dob.getMonth() + 1; // 1-12
  }
  if (this.joiningDate) {
    this.joiningDay = this.joiningDate.getDate();
    this.joiningMonth = this.joiningDate.getMonth() + 1;
  }
//   next();
});

module.exports = mongoose.model('User', UserSchema);