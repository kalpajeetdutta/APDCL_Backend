const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const TaskSchema = require('./Task');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  organizationID: { type: String, required: true, unique: true }, 
  
  // select: false means this field won't be returned by default in queries
  password: { type: String, required: true, select: false },

  role: { type: String, enum: ['Official', 'Admin'], default: 'Official' },
  currentStatus: { 
    type: String, 
    enum: ['Available', 'On Leave', 'In Meeting'], 
    default: 'Available' 
  },
  department: { type: String, default: null },
  designation: { type: String, default: null },
  leaves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leave' }],
  tasks: [TaskSchema],
  
  // Actual Dates
  dob: { type: Date, default: null },
  joiningDate: { type: Date, default: null },
  fcmToken: { type: String, default: null },

  // --- OPTIMIZATION FIELDS ---
  dobDay: { type: Number, index: true }, 
  dobMonth: { type: Number, index: true },
  joiningDay: { type: Number, index: true },
  joiningMonth: { type: Number, index: true },
}, { timestamps: true });


// --- 1. PASSWORD ENCRYPTION (Async) ---
UserSchema.pre('save', async function () {
  // If password is NOT modified, do nothing
  if (!this.isModified('password')) return;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// --- 2. DATE OPTIMIZATION (Async Wrapper) ---
// Changed to 'async function()' so we don't need 'next'
UserSchema.pre('save', async function() {
  if (this.dob) {
    this.dobDay = this.dob.getDate();
    this.dobMonth = this.dob.getMonth() + 1; // 1-12
  }
  if (this.joiningDate) {
    this.joiningDay = this.joiningDate.getDate();
    this.joiningMonth = this.joiningDate.getMonth() + 1;
  }
  // No need to call next() or return anything. 
  // Just finishing the function signals Mongoose to proceed.
});

// --- HELPER METHOD ---
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);