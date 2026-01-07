const express = require('express');
const router = express.Router();
const { applyLeave, getLatestLeave, deleteLeave } = require('../controllers/leaveController');

router.post('/apply', applyLeave);
router.get('/status/:userId', getLatestLeave);
router.delete('/delete/:id', deleteLeave);

module.exports = router;