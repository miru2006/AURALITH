const express = require('express');
const SOSAlert = require('../models/SOSAlert');
const { auth, authorize } = require('../middleware/auth');
const { detectAnomaly, batchAnomalyDetection } = require('../utils/anomalyDetection');
const router = express.Router();

/**
 * @swagger
 * /api/anomaly/analyze/{alertId}:
 *   post:
 *     summary: Analyze specific alert for anomalies
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Anomaly analysis completed
 *       404:
 *         description: Alert not found
 */
router.post('/analyze/:alertId', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await SOSAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Perform anomaly detection
    const anomalyResult = await detectAnomaly(alert.toObject());
    
    // Update alert with anomaly information
    alert.anomalyScore = anomalyResult.anomalyScore;
    alert.isSuspicious = anomalyResult.isSuspicious;
    alert.anomalyReasons = anomalyResult.anomalyReasons;
    
    await alert.save();

    res.json({
      success: true,
      message: 'Anomaly analysis completed',
      data: {
        alertId: alert.alertId,
        ...anomalyResult
      }
    });

  } catch (error) {
    console.error('Anomaly analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze anomaly',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/anomaly/batch-analyze:
 *   post:
 *     summary: Batch analyze multiple alerts for anomalies
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeRange:
 *                 type: string
 *                 enum: [1h, 6h, 24h, 7d]
 *                 default: 24h
 *               threshold:
 *                 type: number
 *                 default: 0.5
 *     responses:
 *       200:
 *         description: Batch analysis completed
 */
router.post('/batch-analyze', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { timeRange = '24h', threshold = 0.5 } = req.body;
    
    // Calculate time filter
    const timeFilter = getTimeFilter(timeRange);
    
    // Get unanalyzed or outdated alerts
    const alerts = await SOSAlert.find({
      createdAt: { $gte: timeFilter },
      $or: [
        { anomalyScore: { $exists: false } },
        { isSuspicious: { $exists: false } }
      ]
    }).limit(100); // Process in batches of 100

    if (alerts.length === 0) {
      return res.json({
        success: true,
        message: 'No alerts to analyze',
        data: { processed: 0, suspicious: 0 }
      });
    }

    // Perform batch anomaly detection
    const results = await batchAnomalyDetection(alerts.map(alert => alert.toObject()));
    
    // Update alerts with anomaly information
    let suspiciousCount = 0;
    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const result = results[i];
      
      alert.anomalyScore = result.anomalyScore;
      alert.isSuspicious = result.isSuspicious;
      alert.anomalyReasons = result.anomalyReasons;
      
      if (result.isSuspicious) suspiciousCount++;
      
      await alert.save();
    }

    res.json({
      success: true,
      message: 'Batch analysis completed',
      data: {
        processed: alerts.length,
        suspicious: suspiciousCount,
        threshold: threshold
      }
    });

  } catch (error) {
    console.error('Batch anomaly analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch analysis',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/anomaly/suspicious-alerts:
 *   get:
 *     summary: Get list of suspicious alerts
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: reviewed
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Suspicious alerts retrieved
 */
router.get('/suspicious-alerts', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { 
      threshold = 0.5, 
      page = 1, 
      limit = 20,
      reviewed 
    } = req.query;
    
    let query = {
      isSuspicious: true,
      anomalyScore: { $gte: parseFloat(threshold) }
    };
    
    // Filter by review status if specified
    if (reviewed !== undefined) {
      query.reviewedBy = reviewed === 'true' ? { $exists: true } : { $exists: false };
    }

    const skip = (page - 1) * limit;
    
    const alerts = await SOSAlert.find(query)
      .sort({ anomalyScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('alertId touristName alertType anomalyScore anomalyReasons isSuspicious status priority location createdAt reviewedBy');

    const total = await SOSAlert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: alerts.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Suspicious alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve suspicious alerts',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/anomaly/review/{alertId}:
 *   post:
 *     summary: Review and mark anomaly alert
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewStatus
 *               - notes
 *             properties:
 *               reviewStatus:
 *                 type: string
 *                 enum: [confirmed_anomaly, false_positive, needs_investigation]
 *               notes:
 *                 type: string
 *               actionTaken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review completed
 *       404:
 *         description: Alert not found
 */
router.post('/review/:alertId', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { alertId } = req.params;
    const { reviewStatus, notes, actionTaken } = req.body;
    
    if (!['confirmed_anomaly', 'false_positive', 'needs_investigation'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review status'
      });
    }

    const alert = await SOSAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Add review information
    alert.reviewedBy = {
      userId: req.user.userId,
      name: `${req.user.firstName} ${req.user.lastName}`,
      timestamp: new Date(),
      reviewStatus,
      notes,
      actionTaken
    };

    // Update alert status based on review
    if (reviewStatus === 'false_positive') {
      alert.status = 'false_alarm';
      alert.isSuspicious = false; // Override anomaly detection
    } else if (reviewStatus === 'confirmed_anomaly') {
      alert.priority = 'medium'; // Lower priority for confirmed fake alerts
    }

    await alert.save();

    res.json({
      success: true,
      message: 'Review completed successfully',
      data: {
        alertId: alert.alertId,
        reviewStatus,
        reviewedBy: alert.reviewedBy.name,
        timestamp: alert.reviewedBy.timestamp
      }
    });

  } catch (error) {
    console.error('Anomaly review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review anomaly',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/anomaly/statistics:
 *   get:
 *     summary: Get anomaly detection statistics
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 7d
 *     responses:
 *       200:
 *         description: Anomaly statistics retrieved
 */
router.get('/statistics', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    // Get comprehensive statistics
    const stats = await Promise.all([
      // Total alerts in time range
      SOSAlert.countDocuments({ createdAt: { $gte: timeFilter } }),
      
      // Suspicious alerts
      SOSAlert.countDocuments({ 
        createdAt: { $gte: timeFilter },
        isSuspicious: true 
      }),
      
      // Reviewed alerts
      SOSAlert.countDocuments({ 
        createdAt: { $gte: timeFilter },
        'reviewedBy.userId': { $exists: true }
      }),
      
      // False positives
      SOSAlert.countDocuments({ 
        createdAt: { $gte: timeFilter },
        'reviewedBy.reviewStatus': 'false_positive'
      }),
      
      // Confirmed anomalies
      SOSAlert.countDocuments({ 
        createdAt: { $gte: timeFilter },
        'reviewedBy.reviewStatus': 'confirmed_anomaly'
      })
    ]);

    const [totalAlerts, suspiciousAlerts, reviewedAlerts, falsePositives, confirmedAnomalies] = stats;

    // Calculate detection metrics
    const detectionRate = totalAlerts > 0 ? (suspiciousAlerts / totalAlerts * 100).toFixed(2) : 0;
    const falsePositiveRate = suspiciousAlerts > 0 ? (falsePositives / suspiciousAlerts * 100).toFixed(2) : 0;
    const accuracy = suspiciousAlerts > 0 ? ((suspiciousAlerts - falsePositives) / suspiciousAlerts * 100).toFixed(2) : 100;

    // Get anomaly reasons distribution
    const reasonsDistribution = await getAnomalyReasonsDistribution(timeFilter);
    
    // Get score distribution
    const scoreDistribution = await getAnomalyScoreDistribution(timeFilter);

    res.json({
      success: true,
      data: {
        overview: {
          totalAlerts,
          suspiciousAlerts,
          reviewedAlerts,
          falsePositives,
          confirmedAnomalies
        },
        metrics: {
          detectionRate: parseFloat(detectionRate),
          falsePositiveRate: parseFloat(falsePositiveRate),
          accuracy: parseFloat(accuracy),
          reviewCompletionRate: suspiciousAlerts > 0 ? (reviewedAlerts / suspiciousAlerts * 100).toFixed(2) : 0
        },
        distributions: {
          anomalyReasons: reasonsDistribution,
          anomalyScores: scoreDistribution
        },
        timeRange
      }
    });

  } catch (error) {
    console.error('Anomaly statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve anomaly statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/anomaly/trends:
 *   get:
 *     summary: Get anomaly detection trends over time
 *     tags: [Anomaly Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly]
 *           default: daily
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Anomaly trends retrieved
 */
router.get('/trends', auth, authorize('authority', 'admin'), async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    
    const trends = await getAnomalyTrends(period, parseInt(days));

    res.json({
      success: true,
      data: {
        trends,
        period,
        days: parseInt(days)
      }
    });

  } catch (error) {
    console.error('Anomaly trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve anomaly trends',
      error: error.message
    });
  }
});

// Helper functions
function getTimeFilter(timeRange) {
  const now = new Date();
  const timeMap = {
    '1h': new Date(now.getTime() - 60 * 60 * 1000),
    '6h': new Date(now.getTime() - 6 * 60 * 60 * 1000),
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  };
  
  return timeMap[timeRange] || timeMap['7d'];
}

async function getAnomalyReasonsDistribution(timeFilter) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: timeFilter },
        isSuspicious: true,
        anomalyReasons: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$anomalyReasons'
    },
    {
      $group: {
        _id: '$anomalyReasons',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  return await SOSAlert.aggregate(pipeline);
}

async function getAnomalyScoreDistribution(timeFilter) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: timeFilter },
        anomalyScore: { $exists: true }
      }
    },
    {
      $bucket: {
        groupBy: '$anomalyScore',
        boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        default: 'Other',
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ];

  return await SOSAlert.aggregate(pipeline);
}

async function getAnomalyTrends(period, days) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  let groupFormat;
  switch (period) {
    case 'hourly':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' }
      };
      break;
    case 'weekly':
      groupFormat = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      break;
    default: // daily
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
  }

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupFormat,
        totalAlerts: { $sum: 1 },
        suspiciousAlerts: {
          $sum: { $cond: [{ $eq: ['$isSuspicious', true] }, 1, 0] }
        },
        avgAnomalyScore: { $avg: '$anomalyScore' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];

  const results = await SOSAlert.aggregate(pipeline);
  
  return results.map(result => ({
    date: formatTrendDate(result._id, period),
    totalAlerts: result.totalAlerts,
    suspiciousAlerts: result.suspiciousAlerts,
    detectionRate: result.totalAlerts > 0 ? (result.suspiciousAlerts / result.totalAlerts * 100).toFixed(2) : 0,
    avgAnomalyScore: result.avgAnomalyScore ? result.avgAnomalyScore.toFixed(3) : 0
  }));
}

function formatTrendDate(dateObj, period) {
  if (period === 'hourly') {
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')} ${String(dateObj.hour).padStart(2, '0')}:00`;
  } else if (period === 'weekly') {
    return `${dateObj.year}-W${String(dateObj.week).padStart(2, '0')}`;
  } else {
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  }
}

module.exports = router;
