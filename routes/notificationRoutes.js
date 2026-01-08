const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead, broadcastNotification } = require('../controllers/notificationController');

router.get('/:userId', getUserNotifications);
router.put('/read/:userId/:notificationId', markAsRead);
router.put('/read-all/:userId', markAllAsRead);
router.post('/broadcast', broadcastNotification);

module.exports = router;