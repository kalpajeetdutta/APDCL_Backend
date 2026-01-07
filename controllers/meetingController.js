const Meeting = require('../models/Meeting');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');

// POST /api/meeting/create
// controllers/meetingController.js

const createMeeting = async (req, res) => {
  try {
    const { title, link, date, startTime, endTime, hostId, attendeeIds } = req.body;

    // Validate that End Time is after Start Time (Optional but recommended)
    // You can add logic here to parse and compare strings if needed

    const newMeeting = await Meeting.create({
      title,
      link,
      date,
      startTime, // "10:00 AM"
      endTime,   // "11:00 AM"
      host: hostId,
      attendees: attendeeIds
    });

    if (attendeeIds && attendeeIds.length > 0) {
      attendeeIds.forEach(attendeeId => {
        // Send to everyone EXCEPT the host
        if (attendeeId.toString() !== hostId.toString()) {
          sendNotification(
            attendeeId, // Target User ID
            "New Meeting Invitation", // Title
            `You are invited to '${title}' on ${date} at ${startTime}`, // Body
            { type: 'Meeting', meetingId: newMeeting._id.toString() } // Custom Data for Navigation
          );
        }
      });
    }

    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/meeting/all?userId=...
const getMeetings = async (req, res) => {
  try {
    const { userId } = req.query; // Who is asking?

    const meetings = await Meeting.find({});
    
    // Transform for Calendar AND Security Check
    const calendarData = {};

    meetings.forEach(meeting => {
      // Security: Check if user is Host or Attendee
      const isAuthorized = meeting.host.toString() === userId || 
                           meeting.attendees.includes(userId);

      const secureMeeting = {
        _id: meeting._id,
        title: meeting.title,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        color: meeting.color,
        type: 'Meeting',
        // HIDE LINK IF UNAUTHORIZED
        link: isAuthorized ? meeting.link : null, 
        isLocked: !isAuthorized
      };

      if (!calendarData[meeting.date]) {
        calendarData[meeting.date] = [];
      }
      calendarData[meeting.date].push(secureMeeting);
    });

    res.status(200).json(calendarData);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HELPER: Get List of Users (To select attendees)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('name role email');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET /api/meeting/my-meetings/:userId
const getUserMeetingsList = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find meetings where user is Host OR Attendee
    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { attendees: userId }
      ]
    })
    .populate('host', 'name email') // Get the host's name
    .populate('attendees', 'name email') // Get attendees' names
    .sort({ date: 1 }); // Sort by Date (Oldest to Newest)

    res.status(200).json(meetings);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// DELETE /api/meeting/delete/:meetingId
const deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const deletedMeeting = await Meeting.findByIdAndDelete(meetingId);

    if (!deletedMeeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Optional: If you updated User statuses to 'In Meeting', you might want to revert them here
    // But for past/cancelled meetings, simple deletion is usually enough.

    res.status(200).json({ message: "Meeting deleted successfully" });

  } catch (error) {
    console.error("Delete Meeting Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { createMeeting, getMeetings, getAllUsers, getUserMeetingsList, deleteMeeting };