const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     summary: Send message to AI chatbot
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               language:
 *                 type: string
 *                 default: en
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Chatbot response
 *       400:
 *         description: Bad request
 */
router.post('/message', auth, [
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'gu', 'mr', 'bn', 'pa'])
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

    const { message, language = 'en', context } = req.body;

    // Prepare context for AI
    const systemPrompt = `You are a helpful assistant for the Tourist Safety Monitoring System. 
    You help tourists with:
    - Emergency procedures and SOS usage
    - Local safety information
    - Navigation and directions
    - Cultural guidance
    - Report filing procedures
    - General travel assistance
    
    Always prioritize safety and provide accurate, helpful information.
    If asked about emergencies, guide users to use the SOS feature.
    Respond in ${language === 'en' ? 'English' : getLanguageName(language)}.`;

    const userContext = {
      userId: req.user.userId,
      userType: req.user.userType,
      ...context
    };

    // Call OpenAI API
    const response = await callOpenAI(systemPrompt, message, userContext);

    // Store conversation for learning
    await storeChatHistory(req.user.userId, message, response, language);

    res.json({
      success: true,
      data: {
        response: response,
        language: language,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot service unavailable',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/chatbot/emergency-help:
 *   post:
 *     summary: Get emergency assistance through chatbot
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emergencyType
 *             properties:
 *               emergencyType:
 *                 type: string
 *                 enum: [medical, security, lost, accident, general]
 *               language:
 *                 type: string
 *                 default: en
 *               location:
 *                 type: object
 *     responses:
 *       200:
 *         description: Emergency guidance provided
 */
router.post('/emergency-help', auth, [
  body('emergencyType').isIn(['medical', 'security', 'lost', 'accident', 'general']),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'gu', 'mr', 'bn', 'pa'])
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

    const { emergencyType, language = 'en', location } = req.body;

    // Provide immediate emergency guidance
    const emergencyGuidance = getEmergencyGuidance(emergencyType, language);

    // Get nearby help resources
    const nearbyResources = await getNearbyEmergencyResources(location);

    res.json({
      success: true,
      data: {
        guidance: emergencyGuidance,
        nearbyResources: nearbyResources,
        sosInstructions: getSosInstructions(language),
        emergencyContacts: getEmergencyContacts(),
        language: language
      }
    });

  } catch (error) {
    console.error('Emergency help error:', error);
    res.status(500).json({
      success: false,
      message: 'Emergency help service unavailable',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/chatbot/safety-tips:
 *   get:
 *     summary: Get location-based safety tips
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Safety tips provided
 */
router.get('/safety-tips', auth, async (req, res) => {
  try {
    const { lat, lng, language = 'en' } = req.query;

    const safetyTips = await getLocationSafetyTips(lat, lng, language);

    res.json({
      success: true,
      data: {
        tips: safetyTips,
        language: language,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      }
    });

  } catch (error) {
    console.error('Safety tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Safety tips service unavailable',
      error: error.message
    });
  }
});

// Helper functions
async function callOpenAI(systemPrompt, userMessage, context) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getFallbackResponse(userMessage);
  }
}

function getFallbackResponse(message) {
  // Provide basic responses when AI is unavailable
  const keywords = message.toLowerCase();
  
  if (keywords.includes('emergency') || keywords.includes('help') || keywords.includes('sos')) {
    return "For emergencies, please use the SOS button in the app or call local emergency services. The app will immediately alert authorities and your emergency contacts.";
  }
  
  if (keywords.includes('safe') || keywords.includes('danger')) {
    return "For your safety, stay in well-lit public areas, keep your belongings secure, and always inform someone about your whereabouts. Use the app's geo-fencing alerts to avoid unsafe areas.";
  }
  
  return "I'm here to help with your safety concerns. You can ask about emergency procedures, local safety tips, or how to use the safety features in this app.";
}

function getLanguageName(code) {
  const languages = {
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'bn': 'Bengali',
    'pa': 'Punjabi'
  };
  return languages[code] || 'English';
}

function getEmergencyGuidance(type, language) {
  const guidance = {
    'medical': {
      'en': "1. Stay calm and assess the situation. 2. Call local emergency services (108/102). 3. Use the SOS button for immediate help. 4. If conscious, keep the person comfortable. 5. Don't move injured persons unless necessary.",
      'hi': "1. शांत रहें और स्थिति का आकलन करें। 2. स्थानीय आपातकालीन सेवाओं को कॉल करें (108/102)। 3. तत्काल सहायता के लिए SOS बटन का उपयोग करें।"
    },
    'security': {
      'en': "1. Move to a safe, public area immediately. 2. Use the SOS button to alert authorities. 3. Don't confront the threat. 4. Contact local police (100). 5. Stay with other people if possible.",
      'hi': "1. तुरंत एक सुरक्षित, सार्वजनिक क्षेत्र में जाएं। 2. अधिकारियों को सचेत करने के लिए SOS बटन का उपयोग करें।"
    },
    'lost': {
      'en': "1. Stay where you are if safe. 2. Use the SOS button to share your location. 3. Contact your emergency contacts. 4. Look for landmarks and describe your surroundings. 5. Stay in well-lit areas.",
      'hi': "1. यदि सुरक्षित हैं तो वहीं रुकें। 2. अपना स्थान साझा करने के लिए SOS बटन का उपयोग करें।"
    },
    'accident': {
      'en': "1. Ensure your safety first. 2. Call emergency services (108). 3. Use SOS button for immediate response. 4. Don't move if injured. 5. Signal for help if able.",
      'hi': "1. पहले अपनी सुरक्षा सुनिश्चित करें। 2. आपातकालीन सेवाओं को कॉल करें (108)।"
    },
    'general': {
      'en': "1. Stay calm and assess the situation. 2. Use the SOS button for immediate help. 3. Move to a safe location if possible. 4. Contact emergency services if needed. 5. Follow app guidance and alerts.",
      'hi': "1. शांत रहें और स्थिति का आकलन करें। 2. तत्काल सहायता के लिए SOS बटन का उपयोग करें।"
    }
  };

  return guidance[type][language] || guidance[type]['en'];
}

function getSosInstructions(language) {
  const instructions = {
    'en': "To use SOS: 1. Press the red SOS button. 2. Confirm the alert when prompted. 3. Your location will be shared with authorities and emergency contacts. 4. Stay on the line if contacted.",
    'hi': "SOS का उपयोग करने के लिए: 1. लाल SOS बटन दबाएं। 2. संकेत मिलने पर अलर्ट की पुष्टि करें।"
  };
  return instructions[language] || instructions['en'];
}

function getEmergencyContacts() {
  return {
    police: '100',
    ambulance: '108',
    fire: '101',
    tourist_helpline: '1363',
    women_helpline: '1091'
  };
}

async function getNearbyEmergencyResources(location) {
  // In a real implementation, this would query a database of emergency resources
  // For now, return mock data
  return [
    {
      type: 'hospital',
      name: 'City General Hospital',
      distance: '2.3 km',
      phone: '+91-XXXXXXXXXX'
    },
    {
      type: 'police_station',
      name: 'Tourism Police Station',
      distance: '1.8 km',
      phone: '+91-XXXXXXXXXX'
    }
  ];
}

async function getLocationSafetyTips(lat, lng, language) {
  // In a real implementation, this would analyze location data and provide specific tips
  const tips = {
    'en': [
      "Avoid displaying expensive items in public",
      "Stay in well-lit areas after dark",
      "Keep emergency contacts readily available",
      "Inform someone about your whereabouts",
      "Use official transportation services"
    ],
    'hi': [
      "सार्वजनिक स्थानों पर महंगी वस्तुओं का प्रदर्शन न करें",
      "अंधेरे के बाद अच्छी तरह से रोशनी वाले क्षेत्रों में रहें"
    ]
  };
  
  return tips[language] || tips['en'];
}

async function storeChatHistory(userId, message, response, language) {
  // Store chat history for analytics and improvement
  // In a real implementation, this would save to a database
  console.log(`Chat stored for user ${userId}: ${message.substring(0, 50)}...`);
}

module.exports = router;
