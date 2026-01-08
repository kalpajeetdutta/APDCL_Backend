const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route: /api/user/available
router.get('/available', userController.getAvailableUsers);

// Route: /api/user/all
router.get('/all', userController.getAllUsers);

module.exports = router;