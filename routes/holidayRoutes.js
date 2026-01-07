const express = require('express');
const router = express.Router();
const { createHoliday, getAllHolidays, deleteHoliday } = require('../controllers/holidayController');

// Endpoints
router.post('/create', createHoliday);
router.get('/all', getAllHolidays);
router.delete('/delete/:id', deleteHoliday);

module.exports = router;