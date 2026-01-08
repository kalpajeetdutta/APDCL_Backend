const User = require('../models/User');
const Leave = require('../models/Leave');
const Meeting = require('../models/Meeting');
const Event = require('../models/Event');

// --- HELPER: Convert "10:30 AM" to minutes ---
const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'All Day' || timeStr === 'N/A') return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
    if (!match) return null;
    let [_, h, m, modifier] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (hours === 12) hours = 0;
    if (modifier && modifier.toUpperCase() === 'PM') hours += 12;
    return hours * 60 + minutes;
};

// GET /api/user/available
const getAvailableUsers = async (req, res) => {
  try {
    const { date, startTime, endTime, search } = req.query;

    if (!date) {
        return res.status(400).json({ message: "Date is required to check availability" });
    }

    const busyUserIds = new Set();

    // 1. CHECK LEAVES
    const leaves = await Leave.find({
        startDate: { $lte: date },
        endDate: { $gte: date },
        status: 'Approved' 
    });
    leaves.forEach(l => busyUserIds.add(l.user.toString()));

    // 2. CHECK MEETINGS
    if (startTime && endTime) {
        const reqStart = parseTime(startTime);
        const reqEnd = parseTime(endTime);

        if (reqStart !== null && reqEnd !== null) {
            const meetings = await Meeting.find({ date: date }); 
            meetings.forEach(m => {
                const meetStart = parseTime(m.startTime);
                const meetEnd = parseTime(m.endTime);
                if (meetStart !== null && meetEnd !== null) {
                    if (reqStart < meetEnd && reqEnd > meetStart) {
                        if (m.host) busyUserIds.add(m.host.toString());
                        if (m.attendees) m.attendees.forEach(a => busyUserIds.add(a.toString()));
                    }
                }
            });
        }
    }

    // 3. CHECK PRIVATE EVENTS
    const events = await Event.find({
        startDate: { $lte: date },
        endDate: { $gte: date },
        scope: 'Private' 
    });
    events.forEach(e => {
        if (e.attendees) e.attendees.forEach(a => busyUserIds.add(a.toString()));
    });

    // 4. FETCH ALL USERS (With Search Filter)
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Use .lean() to get plain JS objects so we can add properties
    const allUsers = await User.find(query).select('name email role department').lean();

    // 5. MAP STATUS TO ALL USERS
    const usersWithStatus = allUsers.map(user => {
        const isBusy = busyUserIds.has(user._id.toString());
        return {
            ...user,
            isAvailable: !isBusy,
            status: isBusy ? 'Busy / On Leave' : 'Available'
        };
    });

    res.json(usersWithStatus);

  } catch (error) {
    console.error("Availability Check Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('name email role');
        res.json(users);
    } catch (e) {
        res.status(500).json({ message: "Error fetching users" });
    }
}

module.exports = { getAvailableUsers, getAllUsers };