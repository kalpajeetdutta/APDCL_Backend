const Holiday = require('../models/Holiday');
const Event = require('../models/Event');
const User = require('../models/User');

// --- HOLIDAYS ---
// POST /api/test/holiday
const createHoliday = async (req, res) => {
    try {
        const newHoliday = new Holiday(req.body);
        const savedHoliday = await newHoliday.save();
        res.status(201).json(savedHoliday);
    } catch (err) {
        res.status(500).json(err);
    }
};
// POST /api/test/holiday/bulk
const createBulkHolidays = async (req, res) => {
    try {
        // req.body should be the Array of JSON objects
        const savedHolidays = await Holiday.insertMany(req.body);
        res.status(201).json({
            message: `Successfully added ${savedHolidays.length} holidays`,
            data: savedHolidays
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/test/holiday
const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find();
        res.status(200).json(holidays);
    } catch (err) {
        res.status(500).json(err);
    }
};

// --- EVENTS ---
// POST /api/test/event
const createEvent = async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(500).json(err);
    }
};

// GET /api/test/event
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json(err);
    }
};

// --- USERS (Birthdays/Anniversaries) ---
// POST /api/test/user
const createUser = async (req, res) => {
    try {
        // The Pre-save hook in your User model will automatically 
        // calculate dobDay, dobMonth, joiningDay, joiningMonth
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        console.log("Error is: ",err )
        res.status(500).json({message: err.message, error:err});
    }
};

// GET /api/test/user
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = {
    createHoliday, getAllHolidays,
    createEvent, getAllEvents,
    createUser, getAllUsers,
    createBulkHolidays
};