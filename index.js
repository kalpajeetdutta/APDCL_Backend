const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const calendarRoutes = require('./routes/calendarRoutes');
const testRoutes = require('./routes/testRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Allow Frontend to connect

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
connectDB();

// Routes
app.use('/api', calendarRoutes);
app.use('/api/test', testRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/holiday', holidayRoutes);
app.use('/api/notification', notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));