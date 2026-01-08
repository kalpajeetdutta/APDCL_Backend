const Event = require('../models/Event');
const sendBroadcast = require('../utils/sendBroadcast');
const sendNotification = require('../utils/sendNotification');

// POST /api/event/create
const createEvent = async (req, res) => {
  try {
    const { 
        title, description, startDate, endDate, startTime, endTime, 
        startAllDay, endAllDay, // ✅ New fields
        type, color, userId, 
        scope, attendeeIds
    } = req.body;

    const newEvent = new Event({
      title,
      description,
      startDate,
      startTime,
      startAllDay, // Save Boolean
      endDate,
      endTime,
      endAllDay,   // Save Boolean
      type,
      color,
      createdBy: userId,
      scope: scope || 'Global',
      attendees: (scope === 'Private' && attendeeIds) ? attendeeIds : []
    });

    const savedEvent = await newEvent.save();

    // --- NOTIFICATION LOGIC ---
    if (scope === 'Private' && attendeeIds && attendeeIds.length > 0) {
        attendeeIds.forEach(targetId => {
            sendNotification(
                targetId,
                "New Event Invitation",
                `You are invited to '${title}' (${type})`,
                { type: 'Event', eventId: savedEvent._id.toString() }
            );
        });
    } else {
        // Broadcast
        sendBroadcast(
            `New ${type || 'Event'} Added`, 
            `${title} is scheduled for ${startDate}`, 
            { type: 'Event', eventId: savedEvent._id.toString() }
        );
    }

    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// DELETE /api/event/delete/:eventId
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/event/all?userId=...
const getEvents = async (req, res) => {
  try {
    const { userId } = req.query;

    const events = await Event.find({
        $or: [
            { scope: 'Global' },
            { scope: { $exists: false } },
            { scope: 'Private', attendees: userId }
        ]
    })
    .populate('attendees', 'name email') // ✅ Populate to show attendees in frontend
    .populate('createdBy', 'name');      // ✅ Populate host

    const calendarData = {};
    events.forEach(event => {
      if (!calendarData[event.startDate]) {
        calendarData[event.startDate] = [];
      }
      calendarData[event.startDate].push(event);
    });

    res.status(200).json(calendarData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createEvent, deleteEvent, getEvents };