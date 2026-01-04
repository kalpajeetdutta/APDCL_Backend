const express = require('express');
const router = express.Router();
const { addTask, getUserTasks, toggleTaskStatus, searchUsers, deleteTask } = require('../controllers/taskController');

router.get('/search-users', searchUsers);
router.post('/add', addTask);
router.get('/:userId', getUserTasks);
router.put('/toggle/:userId/:taskId', toggleTaskStatus);
router.delete('/delete/:userId/:taskId', deleteTask);

module.exports = router;