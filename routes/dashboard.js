const express = require('express');
const SOSAlert = require('../models/SOSAlert');
const EFIR = require('../models/EFIR');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { detectAnomaly } = require('../utils/anomalyDetection');
const router = express.Router();

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved
 */
router.get('/overview', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get statistics
    const stats = await Promise.all([
      // SOS Alert statistics
      SOSAlert.countDocuments({ createdAt: { $gte: today.setHours(0,0,0,0) } }),
      SOSAlert.countDocuments({ createdAt: { $gte: lastWeek } }),
      SOSAlert.countDocuments({ status: 'pending' }),
      SOSAlert.countDocuments({ priority: 'critical', status: { $ne: 'resolved' } }),
      
      // E-FIR statistics
      EFIR.countDocuments({ createdAt: { $gte: today.setHours(0,0,0,0) } }),
      EFIR.countDocuments({ status: 'under_investigation' }),
      
      // Tourist statistics
      User.countDocuments({ userType: 'tourist', isActive: true }),
      User.countDocuments({ 
        userType: 'tourist', 
        lastLogin: { $gte: today.setHours(0,0,0,0) } 
      })
    ]);

    const overview = {
      alerts: {
        today: stats[0],
        thisWeek: stats[1],
        pending: stats[2],
        critical: stats[3]
      },
      efirs: {
        today: stats[4],
        underInvestigation: stats[5]
      },
      tourists: {
        total: stats[6],
        activeToday: stats[7]
      }
    };

    res.json({
      success: true,
      data: { overview }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard overview',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/real-time-alerts:
 *   get:
 *     summary: Get real-time alerts for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Real-time alerts retrieved
 */
router.get('/real-time-alerts', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { status, priority, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const alerts = await SOSAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('alertId touristName alertType priority status location createdAt acknowledgedBy');

    // Add distance calculation if user location is available
    const enrichedAlerts = alerts.map(alert => ({
      ...alert.toObject(),
      responseTime: alert.acknowledgedBy?.timestamp ? 
        Math.round((alert.acknowledgedBy.timestamp - alert.createdAt) / (1000 * 60)) : null,
      urgencyLevel: calculateUrgencyLevel(alert)
    }));

    res.json({
      success: true,
      data: { alerts: enrichedAlerts }
    });

  } catch (error) {
    console.error('Real-time alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve real-time alerts',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/tourist-clusters:
 *   get:
 *     summary: Get tourist location clusters for heatmap
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d]
 *           default: 24h
 *       - in: query
 *         name: bounds
 *         schema:
 *           type: string
 *         description: Geographic bounds in format "minLat,minLng,maxLat,maxLng"
 *     responses:
 *       200:
 *         description: Tourist clusters retrieved
 */
router.get('/tourist-clusters', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { timeRange = '24h', bounds } = req.query;
    
    // Calculate time filter
    const timeFilter = getTimeFilter(timeRange);
    
    // Build geospatial query
    let geoQuery = {};
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
      geoQuery = {
        'location': {
          $geoWithin: {
            $box: [[minLng, minLat], [maxLng, maxLat]]
          }
        }
      };
    }

    // Get recent SOS alerts with location data
    const query = {
      ...geoQuery,
      createdAt: { $gte: timeFilter },
      location: { $exists: true }
    };

    const alerts = await SOSAlert.find(query)
      .select('location alertType priority touristName createdAt')
      .sort({ createdAt: -1 });

    // Group alerts by location clusters
    const clusters = generateLocationClusters(alerts);
    
    // Get high-risk areas
    const riskAreas = await getHighRiskAreas(timeFilter);

    res.json({
      success: true,
      data: {
        clusters,
        riskAreas,
        timeRange,
        totalAlerts: alerts.length
      }
    });

  } catch (error) {
    console.error('Tourist clusters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tourist clusters',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get dashboard analytics data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *     responses:
 *       200:
 *         description: Analytics data retrieved
 */
router.get('/analytics', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    const analytics = await generateAnalytics(period);

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/anomaly-reports:
 *   get:
 *     summary: Get anomaly detection reports
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.5
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Anomaly reports retrieved
 */
router.get('/anomaly-reports', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { threshold = 0.5, limit = 50 } = req.query;
    
    // Get suspicious alerts
    const suspiciousAlerts = await SOSAlert.find({
      isSuspicious: true,
      anomalyScore: { $gte: parseFloat(threshold) }
    })
    .sort({ anomalyScore: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .select('alertId touristName alertType anomalyScore anomalyReasons isSuspicious createdAt');

    // Get anomaly statistics
    const anomalyStats = await getAnomalyStatistics();

    res.json({
      success: true,
      data: {
        suspiciousAlerts,
        statistics: anomalyStats,
        threshold: parseFloat(threshold)
      }
    });

  } catch (error) {
    console.error('Anomaly reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve anomaly reports',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/tourist-lookup:
 *   get:
 *     summary: Quick lookup tourist by digital ID
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: digitalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tourist information retrieved
 *       404:
 *         description: Tourist not found
 */
router.get('/tourist-lookup', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { digitalId } = req.query;
    
    if (!digitalId) {
      return res.status(400).json({
        success: false,
        message: 'Digital ID is required'
      });
    }

    const tourist = await User.findOne({
      'touristProfile.digitalId': digitalId,
      userType: 'tourist'
    }).select('firstName lastName email phoneNumber touristProfile createdAt lastLogin');

    if (!tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Get recent activity
    const recentAlerts = await SOSAlert.find({
      userId: tourist.userId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('alertId alertType status priority createdAt');

    res.json({
      success: true,
      data: {
        tourist: {
          userId: tourist.userId,
          name: `${tourist.firstName} ${tourist.lastName}`,
          email: tourist.email,
          phoneNumber: tourist.phoneNumber,
          digitalId: tourist.touristProfile.digitalId,
          safetyScore: tourist.touristProfile.safetyScore,
          tripItinerary: tourist.touristProfile.tripItinerary,
          emergencyContacts: tourist.touristProfile.emergencyContacts,
          registeredAt: tourist.createdAt,
          lastLogin: tourist.lastLogin
        },
        recentAlerts
      }
    });

  } catch (error) {
    console.error('Tourist lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup tourist',
      error: error.message
    });
  }
});

// Helper functions
function calculateUrgencyLevel(alert) {
  let urgency = 1; // Base urgency
  
  if (alert.priority === 'critical') urgency += 3;
  else if (alert.priority === 'high') urgency += 2;
  else if (alert.priority === 'medium') urgency += 1;
  
  if (alert.status === 'pending') urgency += 2;
  
  // Consider time elapsed
  const minutesElapsed = (Date.now() - alert.createdAt) / (1000 * 60);
  if (minutesElapsed > 30) urgency += 1;
  if (minutesElapsed > 60) urgency += 1;
  
  return Math.min(5, urgency); // Cap at 5
}

function getTimeFilter(timeRange) {
  const now = new Date();
  const timeMap = {
    '1h': new Date(now.getTime() - 60 * 60 * 1000),
    '6h': new Date(now.getTime() - 6 * 60 * 60 * 1000),
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  };
  
  return timeMap[timeRange] || timeMap['24h'];
}

function generateLocationClusters(alerts) {
  // Simple clustering algorithm - group nearby locations
  const clusters = [];
  const processedAlerts = new Set();
  
  alerts.forEach((alert, index) => {
    if (processedAlerts.has(index)) return;
    
    const cluster = {
      centerLocation: alert.location,
      alertCount: 1,
      alerts: [alert],
      riskLevel: getRiskLevel(alert.alertType, alert.priority)
    };
    
    // Find nearby alerts (within 1km)
    alerts.forEach((otherAlert, otherIndex) => {
      if (otherIndex === index || processedAlerts.has(otherIndex)) return;
      
      const distance = calculateDistance(
        alert.location.coordinates[1], alert.location.coordinates[0],
        otherAlert.location.coordinates[1], otherAlert.location.coordinates[0]
      );
      
      if (distance <= 1) { // Within 1km
        cluster.alerts.push(otherAlert);
        cluster.alertCount++;
        processedAlerts.add(otherIndex);
      }
    });
    
    processedAlerts.add(index);
    clusters.push(cluster);
  });
  
  return clusters;
}

async function getHighRiskAreas(timeFilter) {
  // Identify areas with high concentration of alerts
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: timeFilter },
        location: { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          // Group by approximate location (rounded coordinates)
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
        },
        count: { $sum: 1 },
        alertTypes: { $push: '$alertType' },
        priorities: { $push: '$priority' }
      }
    },
    {
      $match: { count: { $gte: 3 } } // Areas with 3+ alerts
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  const riskAreas = await SOSAlert.aggregate(pipeline);
  
  return riskAreas.map(area => ({
    location: [area._id.lng, area._id.lat],
    alertCount: area.count,
    riskLevel: area.count >= 5 ? 'high' : 'medium',
    alertTypes: [...new Set(area.alertTypes)],
    priorities: [...new Set(area.priorities)]
  }));
}

async function generateAnalytics(period) {
  const timeRanges = getAnalyticsTimeRanges(period);
  
  const analytics = {
    alertTrends: await getAlertTrends(timeRanges, period),
    alertTypeDistribution: await getAlertTypeDistribution(timeRanges.current),
    responseTimeMetrics: await getResponseTimeMetrics(timeRanges.current),
    touristActivity: await getTouristActivity(timeRanges.current),
    efirProgress: await getEFIRProgress(timeRanges.current)
  };
  
  return analytics;
}

async function getAnomalyStatistics() {
  const totalAlerts = await SOSAlert.countDocuments();
  const suspiciousAlerts = await SOSAlert.countDocuments({ isSuspicious: true });
  const falsePositives = await SOSAlert.countDocuments({ 
    isSuspicious: true, 
    status: 'false_alarm' 
  });
  
  return {
    totalAlerts,
    suspiciousAlerts,
    suspiciousPercentage: totalAlerts > 0 ? (suspiciousAlerts / totalAlerts * 100).toFixed(2) : 0,
    falsePositives,
    accuracy: suspiciousAlerts > 0 ? ((suspiciousAlerts - falsePositives) / suspiciousAlerts * 100).toFixed(2) : 100
  };
}

function getRiskLevel(alertType, priority) {
  const criticalTypes = ['emergency', 'medical', 'security'];
  const highPriority = ['critical', 'high'];
  
  if (criticalTypes.includes(alertType) && highPriority.includes(priority)) {
    return 'high';
  } else if (criticalTypes.includes(alertType) || highPriority.includes(priority)) {
    return 'medium';
  }
  return 'low';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function getAnalyticsTimeRanges(period) {
  const now = new Date();
  const ranges = {
    daily: {
      current: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      previous: new Date(now.getTime() - 48 * 60 * 60 * 1000)
    },
    weekly: {
      current: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      previous: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    },
    monthly: {
      current: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      previous: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }
  };
  
  return ranges[period] || ranges.weekly;
}

async function getAlertTrends(timeRanges, period) {
  // Implementation for alert trends analysis
  // This would generate time-series data for charts
  return {
    current: 45,
    previous: 38,
    trend: 'up',
    percentage: 18.4
  };
}

async function getAlertTypeDistribution(timeRange) {
  const pipeline = [
    { $match: { createdAt: { $gte: timeRange } } },
    { $group: { _id: '$alertType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  
  return await SOSAlert.aggregate(pipeline);
}

async function getResponseTimeMetrics(timeRange) {
  // Calculate average response times
  const alerts = await SOSAlert.find({
    createdAt: { $gte: timeRange },
    'acknowledgedBy.timestamp': { $exists: true }
  });
  
  const responseTimes = alerts.map(alert => 
    (alert.acknowledgedBy.timestamp - alert.createdAt) / (1000 * 60)
  );
  
  const average = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;
  
  return {
    average: Math.round(average),
    fastest: Math.min(...responseTimes) || 0,
    slowest: Math.max(...responseTimes) || 0
  };
}

async function getTouristActivity(timeRange) {
  const activeTourists = await User.countDocuments({
    userType: 'tourist',
    lastLogin: { $gte: timeRange }
  });
  
  return { activeTourists };
}

async function getEFIRProgress(timeRange) {
  const efirStats = await EFIR.aggregate([
    { $match: { createdAt: { $gte: timeRange } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  return efirStats;
}

module.exports = router;
