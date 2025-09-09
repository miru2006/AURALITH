const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { encryptObject, decryptObject } = require('../utils/encryption');
const router = express.Router();

/**
 * @swagger
 * /api/tourist/profile:
 *   get:
 *     summary: Get tourist profile
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tourist profile retrieved
 */
router.get('/profile', auth, authorize('tourist'), async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tourist profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile: user.touristProfile,
        basicInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tourist/update-profile:
 *   put:
 *     summary: Update tourist profile
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emergencyContacts:
 *                 type: array
 *               tripItinerary:
 *                 type: object
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/update-profile', auth, authorize('tourist'), async (req, res) => {
  try {
    const { emergencyContacts, tripItinerary, preferences, personalInfo } = req.body;
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update tourist profile fields
    if (emergencyContacts) {
      user.touristProfile.emergencyContacts = emergencyContacts;
    }
    
    if (tripItinerary) {
      user.touristProfile.tripItinerary = {
        ...user.touristProfile.tripItinerary,
        ...tripItinerary
      };
    }
    
    if (preferences) {
      user.touristProfile.preferences = {
        ...user.touristProfile.preferences,
        ...preferences
      };
    }

    // Update basic info if provided
    if (personalInfo) {
      if (personalInfo.firstName) user.firstName = personalInfo.firstName;
      if (personalInfo.lastName) user.lastName = personalInfo.lastName;
      if (personalInfo.phoneNumber) user.phoneNumber = personalInfo.phoneNumber;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: user.touristProfile
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tourist/safety-score:
 *   get:
 *     summary: Get tourist safety score and breakdown
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safety score retrieved
 */
router.get('/safety-score', auth, authorize('tourist'), async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const safetyScore = user.touristProfile.safetyScore || 100;
    const breakdown = await calculateSafetyScoreBreakdown(req.user.userId);

    res.json({
      success: true,
      data: {
        currentScore: safetyScore,
        breakdown,
        recommendations: getSafetyRecommendations(safetyScore, breakdown)
      }
    });

  } catch (error) {
    console.error('Safety score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve safety score',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tourist/loyalty-points:
 *   get:
 *     summary: Get loyalty points and history
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty points retrieved
 */
router.get('/loyalty-points', auth, authorize('tourist'), async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentPoints = user.touristProfile.loyaltyPoints || 0;
    const pointsHistory = await getLoyaltyPointsHistory(req.user.userId);
    const availableRewards = getAvailableRewards(currentPoints);

    res.json({
      success: true,
      data: {
        currentPoints,
        pointsHistory,
        availableRewards,
        tier: getLoyaltyTier(currentPoints)
      }
    });

  } catch (error) {
    console.error('Loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve loyalty points',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tourist/tracking/toggle:
 *   post:
 *     summary: Toggle real-time tracking preference
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enableTracking
 *             properties:
 *               enableTracking:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tracking preference updated
 */
router.post('/tracking/toggle', auth, authorize('tourist'), [
  body('enableTracking').isBoolean()
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

    const { enableTracking } = req.body;
    
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.touristProfile.preferences.enableTracking = enableTracking;
    await user.save();

    res.json({
      success: true,
      message: `Real-time tracking ${enableTracking ? 'enabled' : 'disabled'}`,
      data: {
        enableTracking
      }
    });

  } catch (error) {
    console.error('Tracking toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tracking preference',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tourist/digital-id:
 *   get:
 *     summary: Get digital tourist ID details
 *     tags: [Tourist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Digital ID retrieved
 */
router.get('/digital-id', auth, authorize('tourist'), async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const digitalId = user.touristProfile.digitalId;
    const qrCodeData = generateQRCodeData(user);

    res.json({
      success: true,
      data: {
        digitalId,
        qrCodeData,
        isValid: isDigitalIdValid(user.touristProfile.tripItinerary),
        expiryDate: user.touristProfile.tripItinerary?.endDate
      }
    });

  } catch (error) {
    console.error('Digital ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve digital ID',
      error: error.message
    });
  }
});

// Helper functions
async function calculateSafetyScoreBreakdown(userId) {
  // Calculate safety score based on various factors
  return {
    baseScore: 100,
    completedProfile: 10,
    emergencyContactsSet: 15,
    trackingEnabled: 5,
    safeAreaCompliance: 20,
    deductions: {
      sosAlerts: -10,
      unsafeAreas: -5
    }
  };
}

function getSafetyRecommendations(score, breakdown) {
  const recommendations = [];
  
  if (score < 80) {
    recommendations.push('Complete your emergency contacts information');
    recommendations.push('Enable real-time tracking for better safety');
  }
  
  if (score < 60) {
    recommendations.push('Avoid high-risk areas marked in the app');
    recommendations.push('Check in with your emergency contacts regularly');
  }
  
  return recommendations;
}

async function getLoyaltyPointsHistory(userId) {
  // In a real implementation, this would fetch from a points history collection
  return [
    {
      date: new Date(),
      points: 50,
      reason: 'Safe travel completion',
      type: 'earned'
    },
    {
      date: new Date(Date.now() - 86400000),
      points: 25,
      reason: 'Profile completion',
      type: 'earned'
    }
  ];
}

function getAvailableRewards(points) {
  const rewards = [
    { id: 1, name: 'Local Restaurant Discount', cost: 100, discount: '10%' },
    { id: 2, name: 'Transportation Voucher', cost: 200, value: '₹50' },
    { id: 3, name: 'Tour Guide Discount', cost: 300, discount: '15%' },
    { id: 4, name: 'Hotel Booking Discount', cost: 500, discount: '20%' }
  ];
  
  return rewards.filter(reward => reward.cost <= points);
}

function getLoyaltyTier(points) {
  if (points >= 1000) return 'Gold';
  if (points >= 500) return 'Silver';
  if (points >= 100) return 'Bronze';
  return 'Basic';
}

function generateQRCodeData(user) {
  const data = {
    digitalId: user.touristProfile.digitalId,
    name: `${user.firstName} ${user.lastName}`,
    nationality: user.touristProfile.nationality,
    validUntil: user.touristProfile.tripItinerary?.endDate,
    emergencyContact: user.touristProfile.emergencyContacts?.[0]?.phone
  };
  
  // Encrypt sensitive data
  return encryptObject(data);
}

function isDigitalIdValid(tripItinerary) {
  if (!tripItinerary || !tripItinerary.endDate) return false;
  return new Date() <= new Date(tripItinerary.endDate);
}

module.exports = router;
