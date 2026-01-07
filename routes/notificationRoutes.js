const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/:userId', getUserNotifications);
router.put('/read/:userId/:notificationId', markAsRead);
router.put('/read-all/:userId', markAllAsRead);

module.exports = router;