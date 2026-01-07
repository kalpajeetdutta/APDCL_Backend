const Event = require('../models/Event');
const sendBroadcast = require('../utils/sendBroadcast');

// POST /api/event/create
const createEvent = async (req, res) => {
  try {
    // Destructure new endTime field
    const { title, description, startDate, endDate, startTime, endTime, type, color, userId } = req.body;
    // console.log("Creating Event with data:", req.body);

    const newEvent = new Event({
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      type,
      color,
      createdBy: userId
    });

    const savedEvent = await newEvent.save();

    // We don't await this so it doesn't slow down the response
    sendBroadcast(
      `New ${type || 'Event'} Added`, // Title: "New Holiday Added"
      `${title} is scheduled for ${startDate}`, // Body
      { type: 'Event', eventId: savedEvent._id.toString() } // Data
    );

    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// DELETE /api/event/delete/:eventId
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Find and Delete
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    // 2. Handle Case where ID doesn't exist
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });

  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/event/all
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({});

    // Transform for Calendar format: { "2025-10-20": [Object, Object] }
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