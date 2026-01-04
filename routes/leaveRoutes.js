const express = require('express');
const router = express.Router();
const { applyLeave, getLatestLeave } = require('../controllers/leaveController');

router.post('/apply', applyLeave);
router.get('/status/:userId', getLatestLeave);

module.exports = router;