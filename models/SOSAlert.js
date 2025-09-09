const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true
  },
  
  // User Information
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  touristName: {
    type: String,
    required: true
  },
  
  // Alert Details
  alertType: {
    type: String,
    enum: ['emergency', 'medical', 'security', 'lost', 'accident', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'dispatched', 'resolved', 'false_alarm'],
    default: 'pending'
  },
  
  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: String,
  landmark: String,
  
  // Alert Content
  message: String,
  description: String,
  mediaFiles: [{
    type: String,
    url: String,
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio']
    }
  }],
  
  // Confirmation System (Multi-step SOS)
  confirmationSteps: [{
    step: Number,
    confirmed: Boolean,
    timestamp: Date,
    method: {
      type: String,
      enum: ['button_press', 'voice_command', 'shake_gesture', 'pin_entry']
    }
  }],
  isConfirmed: {
    type: Boolean,
    default: false
  },
  
  // Response Information
  acknowledgedBy: {
    userId: String,
    name: String,
    department: String,
    timestamp: Date
  },
  assignedTo: [{
    userId: String,
    name: String,
    department: String,
    role: String,
    timestamp: Date
  }],
  estimatedResponseTime: Number, // in minutes
  actualResponseTime: Number, // in minutes
  
  // Anomaly Detection
  anomalyScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  anomalyReasons: [String],
  
  // Communication
  notifications: [{
    recipient: String,
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'call']
    },
    sent: Boolean,
    timestamp: Date,
    response: String
  }],
  
  // Offline Support
  isOfflineGenerated: {
    type: Boolean,
    default: false
  },
  syncedAt: Date,
  
  // Additional Details
  weatherConditions: String,
  crowdDensity: String,
  nearbyTourists: Number,
  
  // Resolution
  resolution: {
    resolvedBy: String,
    resolutionTime: Date,
    outcome: {
      type: String,
      enum: ['resolved_safely', 'medical_attention', 'police_action', 'false_alarm', 'no_response']
    },
    notes: String,
    followUpRequired: Boolean
  }
  
}, {
  timestamps: true
});

// Indexes for performance and geospatial queries
sosAlertSchema.index({ location: '2dsphere' });
sosAlertSchema.index({ userId: 1 });
sosAlertSchema.index({ alertId: 1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ priority: 1 });
sosAlertSchema.index({ createdAt: -1 });
sosAlertSchema.index({ isConfirmed: 1 });
sosAlertSchema.index({ isSuspicious: 1 });

// Virtual for response time calculation
sosAlertSchema.virtual('responseTime').get(function() {
  if (this.acknowledgedBy && this.acknowledgedBy.timestamp) {
    return Math.round((this.acknowledgedBy.timestamp - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Method to update alert status
sosAlertSchema.methods.updateStatus = function(newStatus, userId, userInfo) {
  this.status = newStatus;
  
  if (newStatus === 'acknowledged' && !this.acknowledgedBy.userId) {
    this.acknowledgedBy = {
      userId,
      name: userInfo.name,
      department: userInfo.department,
      timestamp: new Date()
    };
  }
};

// Method to calculate anomaly score
sosAlertSchema.methods.calculateAnomalyScore = function() {
  let score = 0;
  
  // Check for suspicious patterns
  if (this.confirmationSteps.length < 2) score += 0.3;
  if (this.message && this.message.length < 10) score += 0.2;
  if (this.isOfflineGenerated) score += 0.1;
  
  this.anomalyScore = Math.min(1, score);
  this.isSuspicious = score > 0.5;
};

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
