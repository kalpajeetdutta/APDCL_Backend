const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserStatus, updateDetails, updateFcmToken } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update-status', updateUserStatus);
router.put('/update-details', verifyToken, updateDetails);
router.put('/update-fcm-token', verifyToken, updateFcmToken);

module.exports = router;