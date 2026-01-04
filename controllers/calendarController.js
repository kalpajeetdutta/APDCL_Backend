const User = require('../models/User');
const Event = require('../models/Event');
const Holiday = require('../models/Holiday');
const Meeting = require('../models/Meeting');

// GET /api/calendar?year=2025&userId=... (Optional: &month=...)
const getCalendarData = async (req, res) => {
  try {
    console.log("I have been called here");
    const { month, year, userId } = req.query; 

    if (!year) {
      return res.status(400).json({ message: "Please provide a year" });
    }

    let startDateStr, endDateStr;

    // --- LOGIC CHANGE: Handle Full Year vs Single Month ---
    if (month) {
        // Month Mode (Old logic)
        const monthPad = String(month).padStart(2, '0');
        const lastDay = new Date(year, month, 0).getDate();
        startDateStr = `${year}-${monthPad}-01`;
        endDateStr = `${year}-${monthPad}-${lastDay}`;
    } else {
        // Year Mode (New Optimization)
        startDateStr = `${year}-01-01`;
        endDateStr = `${year}-12-31`;
    }

    // --- EVERYTHING BELOW REMAINS EXACTLY THE SAME ---
    // The Mongo queries use $gte startDate and $lte endDate, 
    // so they automatically adapt to the wider range.

    const holidaysPromise = Holiday.find({ date: { $gte: startDateStr, $lte: endDateStr } });
    const eventsPromise = Event.find({ startDate: { $gte: startDateStr, $lte: endDateStr } });
   // --- UPDATED: Populate Host and Attendees for Meetings ---
    const meetingsPromise = Meeting.find({ date: { $gte: startDateStr, $lte: endDateStr } })
        .populate({
            path: 'host',
            select: 'name email'
        })
        .populate({
            path: 'attendees',
            select: 'name email'
        });

    const tasksPromise = userId ? 
        User.findById(userId)
            .select('tasks')
            .populate({
                path: 'tasks.host',
                select: 'name email' // Get name & email
            })
            .populate({
                path: 'tasks.assignedTo',
                select: 'name email'
            })
            .then(user => {
                if (!user || !user.tasks) return [];
                // Filter by date range (if needed)
                return user.tasks.filter(t => t.date >= startDateStr && t.date <= endDateStr);
            }) 
        : Promise.resolve([]);

    const birthdaysPromise = User.find().select('name dobDay dobMonth');
    const anniversariesPromise = User.find().select('name joiningDay joiningMonth');

    const [holidays, events, meetings, tasks, birthdays, anniversaries] = await Promise.all([
        holidaysPromise, eventsPromise, meetingsPromise, tasksPromise, birthdaysPromise, anniversariesPromise
    ]);

    let responseObj = {};
    const addToResponse = (dateKey, data) => {
        if (!responseObj[dateKey]) responseObj[dateKey] = [];
        responseObj[dateKey].push(data);
    };

    // ... (Keep your existing merging logic for Holidays, Events, Meetings, Tasks) ...
    // Copy/Paste the exact merging logic loops from your previous controller here.
    // I am omitting them for brevity, but they do NOT change.
    
    // 1. Holidays
    holidays.forEach(h => addToResponse(h.date, {
        _id: h._id, type: h.type || 'Full Holiday', title: h.name, color: h.color || '#D32F2F', description: h.description, isAllDay: true
    }));

    // 2. Events (Multi-Day Logic)
    events.forEach(e => {
        console.log("Processing Event for Calendar:", e);
       let current = new Date(e.startDate); 
       const end = new Date(e.endDate || e.startDate);
       while (current <= end) {
           const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
           // Only add if within the requested year
           if (dateKey >= startDateStr && dateKey <= endDateStr) {
               addToResponse(dateKey, {
                   _id: e._id, type: e.type, title: e.title, color: e.color, description: e.description, time: e.startTime, endTime: e.endTime, startDate: e.startDate, endDate: e.endDate, isMultiDay: e.startDate !== e.endDate
               });
           }
           current.setDate(current.getDate() + 1);
       }
    });

   // 3. Meetings
    meetings.forEach(m => {
        // --- Updated Logic: Handle Populated Objects ---
        // Since m.host is now an Object, we check m.host._id
        const hostId = m.host?._id ? m.host._id.toString() : m.host?.toString();
        const isHost = hostId === userId;
        
        // Since attendees are Objects, we check att._id
        const isAttendee = m.attendees.some(att => {
            const attId = att._id ? att._id.toString() : att.toString();
            return attId === userId;
        });

        const hasAccess = isHost || isAttendee;
        addToResponse(m.date, {
            _id: m._id, 
            type: 'Meeting', 
            title: hasAccess ? m.title : 'Private Meeting', 
            date: m.date,
            host: m.host,       // Now contains Name/Email
            attendees: m.attendees, // Now contains Name/Email
            time: m.time, 
            link: hasAccess ? m.link : null, 
            color: '#9C27B0', 
            isLocked: !hasAccess 
        });
    });

    // 4. Tasks
    tasks.forEach(t => {
        addToResponse(t.date, {
            _id: t._id,
            type: t.type,
            title: t.title,
            time: t.time,
            color: t.color || '#2196F3', 
            description: t.description,
            isCompleted: t.isCompleted,
            // --- OPTIONAL: Pass these too for the Details Modal ---
            host: t.host,
            assignedTo: t.assignedTo
        });
    });

    // 5. Birthdays & Anniversaries (Logic update for full year)
    // Since we fetched ALL users, we map them to the requested YEAR
    birthdays.forEach(u => {
       if(u.dobDay && u.dobMonth) {
           // We map the birthday to the requested year
           const monthStr = String(u.dobMonth).padStart(2, '0');
           const dayStr = String(u.dobDay).padStart(2, '0');
           const dateKey = `${year}-${monthStr}-${dayStr}`;
           addToResponse(dateKey, { type: 'Birthday', title: `🎂 Birthday: ${u.name}`, color: '#E91E63', time: 'All Day' });
       }
    });

    anniversaries.forEach(u => {
       if(u.joiningDay && u.joiningMonth) {
           const monthStr = String(u.joiningMonth).padStart(2, '0');
           const dayStr = String(u.joiningDay).padStart(2, '0');
           const dateKey = `${year}-${monthStr}-${dayStr}`;
           addToResponse(dateKey, { type: 'Anniversary', title: `🎉 Work Anniversary: ${u.name}`, color: '#FFC107', time: 'All Day' });
       }
    });

    res.status(200).json(responseObj);

  } catch (error) {
    console.error("Calendar Controller Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getCalendarData };