const express = require('express');
const router = express.Router();
const { 
    createHoliday, getAllHolidays,
    createEvent, getAllEvents,
    createUser, getAllUsers,
    createBulkHolidays
} = require('../controllers/testController');

// Holiday Routes
router.post('/holiday', createHoliday);
router.get('/holiday', getAllHolidays);

// Add this NEW route
router.post('/holiday/bulk', createBulkHolidays);

// Event Routes
router.post('/event', createEvent);
router.get('/event', getAllEvents);

// User Routes
router.post('/user', createUser);
router.get('/user', getAllUsers);

module.exports = router;