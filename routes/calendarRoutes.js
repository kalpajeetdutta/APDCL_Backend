const express = require('express');
const router = express.Router();
const { getCalendarData } = require('../controllers/calendarController');

// Import Auth Middleware here if you have one
// const { protect } = require('../middleware/authMiddleware');

// Route: GET /api/calendar
// Example: http://localhost:5000/api/calendar?month=12&year=2025
router.get('/calendar', getCalendarData); 

module.exports = router;