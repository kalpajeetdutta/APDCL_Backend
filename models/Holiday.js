const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Storing as String "YYYY-MM-DD" is often easier for strict calendar matching
  date: { type: String, required: true, index: true }, 
  
  type: { 
    type: String, 
    enum: ['Full Holiday', 'Restricted Holiday', 'Half Holiday'], 
    default: 'Full Holiday' 
  },
  color: { type: String, default: '#D32F2F' }, 
  description: { type: String }
});

module.exports = mongoose.model('Holiday', HolidaySchema);