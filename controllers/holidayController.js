const Holiday = require('../models/Holiday');

// @desc    Create a new Holiday
// @route   POST /api/holiday/create
// @access  Private (Admin)
const createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;

    // 1. Validation
    if (!name || !date) {
      return res.status(400).json({ message: "Name and Date are required" });
    }

    // 2. Set Default Color based on Type
    let color = '#D32F2F'; // Default Red (Full Holiday)
    if (type === 'Restricted Holiday') color = '#4CAF50'; // Green
    if (type === 'Half Holiday') color = '#FF9800'; // Orange

    // 3. Create
    const newHoliday = await Holiday.create({
      name,
      date,
      type,
      description,
      color
    });

    res.status(201).json(newHoliday);
  } catch (error) {
    console.error("Create Holiday Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get ALL Holidays (Sorted by Date)
// @route   GET /api/holiday/all
// @access  Public
const getAllHolidays = async (req, res) => {
  try {
    // Sort by date string "YYYY-MM-DD" works alphabetically for ISO format
    const holidays = await Holiday.find().sort({ date: 1 }); 
    res.json(holidays);
  } catch (error) {
    console.error("Fetch Holidays Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a Holiday
// @route   DELETE /api/holiday/delete/:id
// @access  Private (Admin)
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    await holiday.deleteOne();
    res.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Delete Holiday Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createHoliday, getAllHolidays, deleteHoliday };