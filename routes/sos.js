const express = require('express');
const { body, validationResult } = require('express-validator');
const SOSAlert = require('../models/SOSAlert');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');
const { detectAnomaly } = require('../utils/anomalyDetection');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SOSAlert:
 *       type: object
 *       required:
 *         - alertType
 *         - location
 *       properties:
 *         alertType:
 *           type: string
 *           enum: [emergency, medical, security, lost, accident, other]
 *         location:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 */

/**
 * @swagger
 * /api/sos/create:
 *   post:
 *     summary: Create SOS alert
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SOSAlert'
 *     responses:
 *       201:
 *         description: SOS alert created successfully
 *       400:
 *         description: Bad request
 */
router.post('/create', auth, [
  body('alertType').isIn(['emergency', 'medical', 'security', 'lost', 'accident', 'other']),
  body('location.coordinates').isArray().custom((value) => {
    if (value.length !== 2 || !value.every(coord => typeof coord === 'number')) {
      throw new Error('Coordinates must be an array of two numbers [longitude, latitude]');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      alertType,
      location,
      message,
      description,
      address,
      landmark,
      mediaFiles,
      isOfflineGenerated
    } = req.body;

    // Get user details
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique alert ID
    const alertId = `SOS${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create SOS alert
    const sosAlert = new SOSAlert({
      alertId,
      userId: req.user.userId,
      touristName: `${user.firstName} ${user.lastName}`,
      alertType,
      location,
      message,
      description,
      address,
      landmark,
      mediaFiles: mediaFiles || [],
      isOfflineGenerated: isOfflineGenerated || false,
      syncedAt: isOfflineGenerated ? new Date() : undefined,
      confirmationSteps: [{
        step: 1,
        confirmed: false,
        timestamp: new Date(),
        method: 'button_press'
      }]
    });

    // Calculate anomaly score
    sosAlert.calculateAnomalyScore();

    // Set priority based on alert type and anomaly score
    if (alertType === 'emergency' || alertType === 'medical') {
      sosAlert.priority = 'critical';
    } else if (sosAlert.isSuspicious) {
      sosAlert.priority = 'medium';
    } else {
      sosAlert.priority = 'high';
    }

    await sosAlert.save();

    // Send immediate notifications if not suspicious
    if (!sosAlert.isSuspicious) {
      await sendSOSNotifications(sosAlert, user);
    }

    res.status(201).json({
      success: true,
      message: 'SOS alert created successfully',
      data: {
        alertId: sosAlert.alertId,
        status: sosAlert.status,
        priority: sosAlert.priority,
        requiresConfirmation: !sosAlert.isConfirmed,
        isSuspicious: sosAlert.isSuspicious
      }
    });

  } catch (error) {
    console.error('SOS creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create SOS alert',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sos/confirm/{alertId}:
 *   post:
 *     summary: Confirm SOS alert (multi-step confirmation)
 *     tags: [SOS]
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
 *             properties:
 *               confirmationMethod:
 *                 type: string
 *                 enum: [button_press, voice_command, shake_gesture, pin_entry]
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: SOS alert confirmed
 *       404:
 *         description: Alert not found
 */
router.post('/confirm/:alertId', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { confirmationMethod, pin } = req.body;

    const sosAlert = await SOSAlert.findOne({ 
      alertId, 
      userId: req.user.userId 
    });

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS alert not found'
      });
    }

    // Add confirmation step
    const stepNumber = sosAlert.confirmationSteps.length + 1;
    sosAlert.confirmationSteps.push({
      step: stepNumber,
      confirmed: true,
      timestamp: new Date(),
      method: confirmationMethod
    });

    // Check if alert should be confirmed (require at least 2 steps)
    if (stepNumber >= 2) {
      sosAlert.isConfirmed = true;
      
      // Recalculate anomaly score with confirmation
      sosAlert.calculateAnomalyScore();
      
      // Send notifications to authorities
      const user = await User.findOne({ userId: req.user.userId });
      await sendSOSNotifications(sosAlert, user);
    }

    await sosAlert.save();

    res.json({
      success: true,
      message: stepNumber >= 2 ? 'SOS alert confirmed and dispatched' : 'Confirmation step recorded',
      data: {
        alertId: sosAlert.alertId,
        confirmationSteps: stepNumber,
        isConfirmed: sosAlert.isConfirmed,
        status: sosAlert.status
      }
    });

  } catch (error) {
    console.error('SOS confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm SOS alert',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sos/acknowledge/{alertId}:
 *   post:
 *     summary: Acknowledge SOS alert (for authorities)
 *     tags: [SOS]
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
 *         description: SOS alert acknowledged
 *       403:
 *         description: Unauthorized
 */
router.post('/acknowledge/:alertId', auth, async (req, res) => {
  try {
    // Check if user is authority
    if (req.user.userType !== 'authority' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authorities can acknowledge SOS alerts'
      });
    }

    const { alertId } = req.params;
    const sosAlert = await SOSAlert.findOne({ alertId });

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS alert not found'
      });
    }

    const user = await User.findOne({ userId: req.user.userId });
    
    // Update alert status
    sosAlert.updateStatus('acknowledged', req.user.userId, {
      name: `${user.firstName} ${user.lastName}`,
      department: user.authorityProfile?.department || 'Unknown'
    });

    await sosAlert.save();

    // Notify tourist about acknowledgment
    const tourist = await User.findOne({ userId: sosAlert.userId });
    await sendNotification(tourist, {
      type: 'sms',
      message: `Your SOS alert has been acknowledged by ${user.firstName} ${user.lastName}. Help is on the way.`
    });

    res.json({
      success: true,
      message: 'SOS alert acknowledged successfully',
      data: {
        alertId: sosAlert.alertId,
        status: sosAlert.status,
        acknowledgedBy: sosAlert.acknowledgedBy
      }
    });

  } catch (error) {
    console.error('SOS acknowledgment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge SOS alert',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sos/list:
 *   get:
 *     summary: Get SOS alerts list
 *     tags: [SOS]
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
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: SOS alerts retrieved successfully
 */
router.get('/list', auth, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Filter by user for tourists, show all for authorities
    if (req.user.userType === 'tourist') {
      query.userId = req.user.userId;
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    
    const alerts = await SOSAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-confirmationSteps -notifications');

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
    console.error('SOS list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SOS alerts',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sos/{alertId}:
 *   get:
 *     summary: Get SOS alert details
 *     tags: [SOS]
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
 *         description: SOS alert details retrieved
 *       404:
 *         description: Alert not found
 */
router.get('/:alertId', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    let query = { alertId };
    
    // Tourists can only see their own alerts
    if (req.user.userType === 'tourist') {
      query.userId = req.user.userId;
    }

    const sosAlert = await SOSAlert.findOne(query);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS alert not found'
      });
    }

    res.json({
      success: true,
      data: { alert: sosAlert }
    });

  } catch (error) {
    console.error('SOS details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SOS alert details',
      error: error.message
    });
  }
});

// Helper function to send SOS notifications
async function sendSOSNotifications(sosAlert, user) {
  try {
    // Notify emergency contacts
    if (user.touristProfile?.emergencyContacts) {
      for (const contact of user.touristProfile.emergencyContacts) {
        await sendNotification(contact, {
          type: 'sms',
          message: `EMERGENCY: ${user.firstName} ${user.lastName} has triggered an SOS alert. Location: ${sosAlert.address || 'GPS coordinates provided'}. Alert ID: ${sosAlert.alertId}`
        });
      }
    }

    // Find nearby authorities (this would typically query a geospatial index)
    const nearbyAuthorities = await User.find({
      userType: 'authority',
      isActive: true
    }).limit(5);

    // Notify authorities
    for (const authority of nearbyAuthorities) {
      await sendNotification(authority, {
        type: 'push',
        message: `New SOS Alert: ${sosAlert.alertType} - ${sosAlert.priority} priority`,
        data: {
          alertId: sosAlert.alertId,
          location: sosAlert.location,
          touristName: sosAlert.touristName
        }
      });
    }

    // Store notification log
    sosAlert.notifications.push({
      recipient: 'emergency_contacts',
      type: 'sms',
      sent: true,
      timestamp: new Date()
    });

    await sosAlert.save();

  } catch (error) {
    console.error('Notification error:', error);
  }
}

module.exports = router;
