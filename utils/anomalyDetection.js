// AI-based anomaly detection utilities
const SOSAlert = require('../models/SOSAlert');

// Detect anomalies in SOS alerts using various algorithms
const detectAnomaly = async (alertData, userHistory = []) => {
  try {
    const anomalyScores = {};
    
    // 1. Frequency-based anomaly detection
    anomalyScores.frequency = await detectFrequencyAnomaly(alertData, userHistory);
    
    // 2. Location-based anomaly detection
    anomalyScores.location = await detectLocationAnomaly(alertData, userHistory);
    
    // 3. Behavioral pattern anomaly
    anomalyScores.behavior = await detectBehaviorAnomaly(alertData, userHistory);
    
    // 4. Content-based anomaly detection
    anomalyScores.content = detectContentAnomaly(alertData);
    
    // 5. Time-based anomaly detection
    anomalyScores.timing = detectTimingAnomaly(alertData);
    
    // Calculate overall anomaly score (weighted average)
    const weights = {
      frequency: 0.25,
      location: 0.20,
      behavior: 0.25,
      content: 0.20,
      timing: 0.10
    };
    
    const overallScore = Object.entries(anomalyScores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key]);
    }, 0);
    
    const anomalyReasons = [];
    
    // Identify specific anomaly reasons
    if (anomalyScores.frequency > 0.6) anomalyReasons.push('High frequency of alerts');
    if (anomalyScores.location > 0.7) anomalyReasons.push('Unusual location pattern');
    if (anomalyScores.behavior > 0.6) anomalyReasons.push('Abnormal user behavior');
    if (anomalyScores.content > 0.8) anomalyReasons.push('Suspicious content pattern');
    if (anomalyScores.timing > 0.7) anomalyReasons.push('Unusual timing pattern');
    
    return {
      anomalyScore: Math.min(1, overallScore),
      isSuspicious: overallScore > 0.5,
      anomalyReasons,
      detailedScores: anomalyScores
    };
    
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return {
      anomalyScore: 0,
      isSuspicious: false,
      anomalyReasons: [],
      detailedScores: {}
    };
  }
};

// Detect frequency-based anomalies
const detectFrequencyAnomaly = async (alertData, userHistory) => {
  try {
    const { userId } = alertData;
    
    // Get user's alert history for the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = await SOSAlert.find({
      userId,
      createdAt: { $gte: last24Hours }
    });
    
    // Calculate frequency score
    const alertCount = recentAlerts.length;
    
    // More than 3 alerts in 24 hours is suspicious
    if (alertCount >= 5) return 1.0;
    if (alertCount >= 3) return 0.8;
    if (alertCount >= 2) return 0.4;
    
    return 0.0;
  } catch (error) {
    console.error('Frequency anomaly detection error:', error);
    return 0.0;
  }
};

// Detect location-based anomalies
const detectLocationAnomaly = async (alertData, userHistory) => {
  try {
    const { location, userId } = alertData;
    
    if (!location || !location.coordinates) return 0.0;
    
    // Get user's recent location history
    const recentAlerts = await SOSAlert.find({
      userId,
      location: { $exists: true },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).limit(10);
    
    if (recentAlerts.length === 0) return 0.0;
    
    // Calculate average distance from previous locations
    const [currentLng, currentLat] = location.coordinates;
    let totalDistance = 0;
    let validLocations = 0;
    
    for (const alert of recentAlerts) {
      if (alert.location && alert.location.coordinates) {
        const [lng, lat] = alert.location.coordinates;
        const distance = calculateDistance(currentLat, currentLng, lat, lng);
        totalDistance += distance;
        validLocations++;
      }
    }
    
    if (validLocations === 0) return 0.0;
    
    const averageDistance = totalDistance / validLocations;
    
    // If current location is very far from usual locations, it's suspicious
    if (averageDistance > 100) return 1.0; // > 100km
    if (averageDistance > 50) return 0.7;   // > 50km
    if (averageDistance > 20) return 0.4;   // > 20km
    
    return 0.0;
  } catch (error) {
    console.error('Location anomaly detection error:', error);
    return 0.0;
  }
};

// Detect behavioral pattern anomalies
const detectBehaviorAnomaly = async (alertData, userHistory) => {
  try {
    const { confirmationSteps, isOfflineGenerated } = alertData;
    
    let score = 0.0;
    
    // Check confirmation pattern
    if (!confirmationSteps || confirmationSteps.length < 2) {
      score += 0.3; // Insufficient confirmation
    }
    
    // Check if generated offline (could indicate manipulation)
    if (isOfflineGenerated) {
      score += 0.2;
    }
    
    // Check for rapid-fire confirmations (too fast for human)
    if (confirmationSteps && confirmationSteps.length > 1) {
      const timeDiff = new Date(confirmationSteps[1].timestamp) - new Date(confirmationSteps[0].timestamp);
      if (timeDiff < 1000) { // Less than 1 second between confirmations
        score += 0.4;
      }
    }
    
    return Math.min(1.0, score);
  } catch (error) {
    console.error('Behavior anomaly detection error:', error);
    return 0.0;
  }
};

// Detect content-based anomalies
const detectContentAnomaly = (alertData) => {
  try {
    const { message, description } = alertData;
    
    let score = 0.0;
    
    // Check message quality
    if (!message || message.trim().length < 5) {
      score += 0.4; // Very short or no message
    }
    
    // Check for spam indicators
    const spamPatterns = [
      /test/i,
      /fake/i,
      /spam/i,
      /joke/i,
      /123+/,
      /aaa+/i
    ];
    
    const fullText = `${message || ''} ${description || ''}`;
    for (const pattern of spamPatterns) {
      if (pattern.test(fullText)) {
        score += 0.3;
        break;
      }
    }
    
    // Check for repeated characters (like "aaaa" or "1111")
    if (/(.)\1{4,}/.test(fullText)) {
      score += 0.3;
    }
    
    return Math.min(1.0, score);
  } catch (error) {
    console.error('Content anomaly detection error:', error);
    return 0.0;
  }
};

// Detect timing-based anomalies
const detectTimingAnomaly = (alertData) => {
  try {
    const currentHour = new Date().getHours();
    
    // Very late night alerts (2 AM - 5 AM) are slightly more suspicious
    if (currentHour >= 2 && currentHour <= 5) {
      return 0.3;
    }
    
    // Early morning alerts (5 AM - 7 AM) are also slightly suspicious
    if (currentHour >= 5 && currentHour <= 7) {
      return 0.2;
    }
    
    return 0.0;
  } catch (error) {
    console.error('Timing anomaly detection error:', error);
    return 0.0;
  }
};

// LSTM-based anomaly detection for travel patterns (mock implementation)
const detectTravelPatternAnomaly = async (userId, currentLocation) => {
  try {
    // In a real implementation, this would use a trained LSTM model
    // to analyze travel patterns and detect anomalies
    
    // Mock implementation - return random score for demonstration
    return Math.random() * 0.5; // Keep it low for demo
  } catch (error) {
    console.error('Travel pattern anomaly detection error:', error);
    return 0.0;
  }
};

// Isolation Forest implementation for outlier detection (simplified)
const isolationForestDetection = (dataPoints) => {
  try {
    // Simplified isolation forest algorithm
    // In a real implementation, use a proper machine learning library
    
    if (dataPoints.length < 5) return 0.0;
    
    // Calculate basic statistical measures
    const values = dataPoints.map(point => point.value || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Current value
    const currentValue = values[values.length - 1];
    
    // Calculate z-score
    const zScore = Math.abs((currentValue - mean) / stdDev);
    
    // Convert z-score to anomaly score (0-1)
    return Math.min(1.0, zScore / 3); // 3 sigma rule
  } catch (error) {
    console.error('Isolation forest detection error:', error);
    return 0.0;
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Batch anomaly detection for multiple alerts
const batchAnomalyDetection = async (alerts) => {
  const results = [];
  
  for (const alert of alerts) {
    const anomalyResult = await detectAnomaly(alert);
    results.push({
      alertId: alert.alertId,
      ...anomalyResult
    });
  }
  
  return results;
};

module.exports = {
  detectAnomaly,
  detectFrequencyAnomaly,
  detectLocationAnomaly,
  detectBehaviorAnomaly,
  detectContentAnomaly,
  detectTimingAnomaly,
  detectTravelPatternAnomaly,
  isolationForestDetection,
  batchAnomalyDetection,
  calculateDistance
};
