const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    
    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    // 2. Extract the token string
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access Denied. Token missing.' });
    }

    // 3. Verify token
    // Ensure process.env.JWT_SECRET matches what you used in your login controller
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach user payload to request object
    // This allows subsequent controllers to access req.user.id, etc.
    req.user = decoded; 

    next(); // Proceed to the controller

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    // 403 Forbidden is appropriate for invalid/expired tokens
    res.status(403).json({ message: 'Invalid or Expired Token.' });
  }
};

module.exports = { verifyToken };