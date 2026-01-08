const User = require('../models/User');
const Event = require('../models/Event');
const Holiday = require('../models/Holiday');
const Meeting = require('../models/Meeting');

// GET /api/calendar?year=2025&userId=...
const getCalendarData = async (req, res) => {
  try {
    const { month, year, userId } = req.query; 

    if (!year) {
      return res.status(400).json({ message: "Please provide a year" });
    }

    const isGuest = userId === 'guest'; 

    let startDateStr, endDateStr;

    // 1. Handle Date Range
    if (month) {
        const monthPad = String(month).padStart(2, '0');
        const lastDay = new Date(year, month, 0).getDate();
        startDateStr = `${year}-${monthPad}-01`;
        endDateStr = `${year}-${monthPad}-${lastDay}`;
    } else {
        startDateStr = `${year}-01-01`;
        endDateStr = `${year}-12-31`;
    }

    // --- 2. FETCH DATA ---
    
    // A. Holidays (Always Fetch)
    const holidaysPromise = Holiday.find({ date: { $gte: startDateStr, $lte: endDateStr } });

    // B. Events (Filtered by Scope & Date)
    // ✅ UPDATED: Filter by Global vs Private (User must be attendee)
    const eventsPromise = isGuest ? Promise.resolve([]) : Event.find({ 
        startDate: { $gte: startDateStr, $lte: endDateStr },
        $or: [
            { scope: 'Global' },
            { scope: { $exists: false } }, // Handle legacy data
            { scope: 'Private', attendees: userId }
        ]
    })
    .populate({ path: 'createdBy', select: 'name email' }) // Populate Host
    .populate({ path: 'attendees', select: 'name email' }); // Populate Attendees

    // C. Meetings (Filtered by Date)
    const meetingsPromise = isGuest ? Promise.resolve([]) : Meeting.find({ date: { $gte: startDateStr, $lte: endDateStr } })
        .populate({ path: 'host', select: 'name email' })
        .populate({ path: 'attendees', select: 'name email' });

    // D. Tasks (User Specific)
    const tasksPromise = (!isGuest && userId) ? 
        User.findById(userId)
            .select('tasks')
            .populate({ path: 'tasks.host', select: 'name email' })
            .populate({ path: 'tasks.assignedTo', select: 'name email' })
            .then(user => {
                if (!user || !user.tasks) return [];
                return user.tasks.filter(t => t.date >= startDateStr && t.date <= endDateStr);
            }) 
        : Promise.resolve([]);

    // E. Birthdays & Anniversaries
    const birthdaysPromise = isGuest ? Promise.resolve([]) : User.find().select('name dobDay dobMonth');
    const anniversariesPromise = isGuest ? Promise.resolve([]) : User.find().select('name joiningDay joiningMonth');

    // Execute All
    const [holidays, events, meetings, tasks, birthdays, anniversaries] = await Promise.all([
        holidaysPromise, eventsPromise, meetingsPromise, tasksPromise, birthdaysPromise, anniversariesPromise
    ]);

    // --- 3. CONSOLIDATE RESPONSE ---
    let responseObj = {};
    const addToResponse = (dateKey, data) => {
        if (!responseObj[dateKey]) responseObj[dateKey] = [];
        responseObj[dateKey].push(data);
    };

    // 1. Holidays
    holidays.forEach(h => addToResponse(h.date, {
        _id: h._id, 
        type: h.type || 'Full Holiday', 
        title: h.name, 
        color: h.color || '#D32F2F', 
        description: h.description, 
        isAllDay: h.isAllDay,
        startAllDay: true, // Holidays are usually all day
        endAllDay: true
    }));

    // 2. Events (Flatten Multi-day events)
    events.forEach(e => {
       let current = new Date(e.startDate); 
       const end = new Date(e.endDate || e.startDate);
       
       // Populate Host Object correctly
       const hostData = e.createdBy || null;

       while (current <= end) {
           const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
           
           if (dateKey >= startDateStr && dateKey <= endDateStr) {
               addToResponse(dateKey, {
                   _id: e._id, 
                   type: e.type, 
                   title: e.title, 
                   color: e.color, 
                   description: e.description, 
                   // ✅ NEW TIME FIELDS
                   startTime: e.startTime, 
                   endTime: e.endTime, 
                   startAllDay: e.startAllDay, // Boolean
                   endAllDay: e.endAllDay,     // Boolean
                   // Dates
                   startDate: e.startDate, 
                   endDate: e.endDate, 
                   isMultiDay: e.startDate !== e.endDate,
                   // Meta
                   host: hostData,
                   attendees: e.attendees,
                   scope: e.scope
               });
           }
           current.setDate(current.getDate() + 1);
       }
    });

   // 3. Meetings (Security Check Logic)
    meetings.forEach(m => {
        const hostId = m.host?._id ? m.host._id.toString() : m.host?.toString();
        const isHost = hostId === userId;
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
            host: m.host,       
            attendees: m.attendees, 
            startTime: m.startTime || m.time, 
            endTime: m.endTime || "",
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
            host: t.host,
            assignedTo: t.assignedTo
        });
    });

    // 5. Birthdays & Anniversaries
    birthdays.forEach(u => {
        if(u.dobDay && u.dobMonth) {
            const monthStr = String(u.dobMonth).padStart(2, '0');
            const dayStr = String(u.dobDay).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            addToResponse(dateKey, { type: 'Birthday', title: `🎂 Birthday: ${u.name}`, color: '#E91E63', time: 'All Day', startAllDay: true });
        }
    });

    anniversaries.forEach(u => {
        if(u.joiningDay && u.joiningMonth) {
            const monthStr = String(u.joiningMonth).padStart(2, '0');
            const dayStr = String(u.joiningDay).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            addToResponse(dateKey, { type: 'Anniversary', title: `🎉 Work Anniversary: ${u.name}`, color: '#FFC107', time: 'All Day', startAllDay: true });
        }
    });

    res.status(200).json(responseObj);

  } catch (error) {
    console.error("Calendar Controller Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getCalendarData };