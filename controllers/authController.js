const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- HELPER: Generate JWT Token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // User stays logged in for 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin only)
const registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      organizationID, 
      password, 
      role
    } = req.body;

    // 1. Check if User already exists (ONLY by OrganizationID now)
    // We removed the email check here.
    const userExists = await User.findOne({ organizationID });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this Organization ID' });
    }

    // 2. Create User
    // Note: 'dob' and 'joiningDate' are removed here. 
    // They will be updated by the user upon first login.
    const user = await User.create({
      name,
      email,
      organizationID,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        organizationID: user.organizationID,
        role: user.role,
        token: generateToken(user._id), 
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { organizationID, password } = req.body;

    // 1. Determine Login Method (Email OR OrganizationID)
    // keeping this flexible is good for UX, even if uniqueness is strictly OrgID
   if (!organizationID){
      return res.status(400).json({ message: 'Please provide Organization ID' });
    }
    else if (!password){
      return res.status(400).json({ message: 'Please provide Password' });
    }

    // 2. Find User
    const user = await User.findOne({organizationID}).select('+password');

    // 3. Check Password
    if (user && (await user.matchPassword(password))) {
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        organizationID: user.organizationID,
        role: user.role,
        dob: user.dob,
        joiningDate: user.joiningDate,
        department: user.department,
        designation: user.designation,
        token: generateToken(user._id),
      });

    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      organizationID: user.organizationID,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// PUT /api/auth/update-status
const updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    
    // Validate status enum
    const validStatuses = ['Available', 'On Leave', 'In Meeting'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { currentStatus: status },
      { new: true } // Return updated doc
    );

    res.json({ message: "Status updated", currentStatus: user.currentStatus });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update user profile details (Complete Profile)
// @route   PUT /api/auth/update-details
// @access  Private
const updateDetails = async (req, res) => {
  try {
    const { userId, department, designation, dob, joiningDate } = req.body;

    // 1. Validate Input
    if (!userId || !department || !designation || !dob || !joiningDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 2. Find User and Update
    // We use { new: true } to return the updated document immediately
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        department,
        designation,
        dob: new Date(dob), // Ensure correct Date format
        joiningDate: new Date(joiningDate),
      },
      { new: true, runValidators: true } 
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // 3. Return updated user data
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update Details Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route PUT /api/auth/update-fcm-token
const updateFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.status(200).json({ message: "Token updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserStatus, updateDetails, updateFcmToken };