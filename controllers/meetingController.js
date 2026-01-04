const Meeting = require('../models/Meeting');
const User = require('../models/User');

// POST /api/meeting/create
const createMeeting = async (req, res) => {
  try {
    const { hostId, title, link, date, time, attendeeIds } = req.body;

    // 1. Create Meeting
    const newMeeting = new Meeting({
      host: hostId,
      title,
      link,
      date,
      time,
      attendees: attendeeIds // Array of User IDs
    });
    await newMeeting.save();

    // 2. Update Status of Attendees (Only if meeting is Today)
    // Logic: If I schedule a meeting for next year, I shouldn't be "In Meeting" today.
    // For this requirement, we'll assume the admin wants to mark them now or check date.
    const today = new Date().toISOString().split('T')[0];
    
    if (date === today) {
        await User.updateMany(
            { _id: { $in: attendeeIds } },
            { $set: { currentStatus: 'In Meeting' } }
        );
    }

    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
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
        time: meeting.time,
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