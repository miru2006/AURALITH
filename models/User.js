const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: String,
    unique: true,
    required: true
  },
  userType: {
    type: String,
    enum: ['tourist', 'authority', 'admin', 'local_service'],
    required: true
  },
  
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  // Profile Information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  profileImage: String,
  
  // Tourist-specific fields
  touristProfile: {
    digitalId: String,
    passportNumber: String,
    aadhaarNumber: String,
    nationality: String,
    dateOfBirth: Date,
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String,
      email: String
    }],
    tripItinerary: {
      startDate: Date,
      endDate: Date,
      destinations: [String],
      purpose: String
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    preferences: {
      language: {
        type: String,
        default: 'en'
      },
      enableTracking: {
        type: Boolean,
        default: false
      },
      notificationSettings: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      }
    }
  },
  
  // Authority-specific fields
  authorityProfile: {
    department: String,
    designation: String,
    badgeNumber: String,
    jurisdiction: [String],
    accessLevel: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  
  // Security
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'touristProfile.digitalId': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update safety score
userSchema.methods.updateSafetyScore = function(score) {
  if (this.userType === 'tourist') {
    this.touristProfile.safetyScore = Math.max(0, Math.min(100, score));
  }
};

module.exports = mongoose.model('User', userSchema);
