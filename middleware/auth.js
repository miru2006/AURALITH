const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findOne({ userId: decoded.userId }).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Add user to request object
      req.user = {
        userId: user.userId,
        userType: user.userType,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
