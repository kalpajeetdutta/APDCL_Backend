const express = require('express');
const router = express.Router();
const { 
    createMeeting, 
    getMeetings, 
    getAllUsers, 
    getUserMeetingsList,
    deleteMeeting
} = require('../controllers/meetingController');

router.post('/create', createMeeting);
router.get('/all', getMeetings);
router.get('/users', getAllUsers);
router.get('/my-meetings/:userId', getUserMeetingsList);
router.delete('/delete/:meetingId', deleteMeeting);

module.exports = router;