const express = require('express');
const router = express.Router();
const { createEvent, getEvents, deleteEvent } = require('../controllers/eventController');

router.post('/create', createEvent);
router.delete('/delete/:eventId', deleteEvent);
router.get('/all', getEvents);

module.exports = router;