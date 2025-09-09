const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Supported languages with their codes
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'gu': 'Gujarati',
  'mr': 'Marathi',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese'
};

/**
 * @swagger
 * /api/translation/translate:
 *   post:
 *     summary: Translate text to specified language
 *     tags: [Translation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLanguage
 *             properties:
 *               text:
 *                 type: string
 *               targetLanguage:
 *                 type: string
 *               sourceLanguage:
 *                 type: string
 *                 default: auto
 *     responses:
 *       200:
 *         description: Translation successful
 *       400:
 *         description: Bad request
 */
router.post('/translate', auth, [
  body('text').trim().isLength({ min: 1, max: 5000 }),
  body('targetLanguage').isIn(Object.keys(SUPPORTED_LANGUAGES)),
  body('sourceLanguage').optional().isIn([...Object.keys(SUPPORTED_LANGUAGES), 'auto'])
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

    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    // Check if translation is needed
    if (sourceLanguage === targetLanguage) {
      return res.json({
        success: true,
        data: {
          translatedText: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          cached: false
        }
      });
    }

    // Try to get cached translation first
    const cacheKey = `translation:${hashText(text)}:${sourceLanguage}:${targetLanguage}`;
    const cachedTranslation = await getCachedTranslation(cacheKey);

    if (cachedTranslation) {
      return res.json({
        success: true,
        data: {
          translatedText: cachedTranslation,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          cached: true
        }
      });
    }

    // Perform translation
    const translatedText = await performTranslation(text, sourceLanguage, targetLanguage);

    // Cache the translation
    await cacheTranslation(cacheKey, translatedText);

    res.json({
      success: true,
      data: {
        translatedText: translatedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        cached: false
      }
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation service unavailable',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/translation/emergency-phrases:
 *   get:
 *     summary: Get emergency phrases in specified language
 *     tags: [Translation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Emergency phrases retrieved
 */
router.get('/emergency-phrases', auth, async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    const emergencyPhrases = await getEmergencyPhrases(language);

    res.json({
      success: true,
      data: {
        language: language,
        languageName: SUPPORTED_LANGUAGES[language],
        phrases: emergencyPhrases
      }
    });

  } catch (error) {
    console.error('Emergency phrases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emergency phrases',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/translation/safety-instructions:
 *   get:
 *     summary: Get safety instructions in specified language
 *     tags: [Translation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [first_aid, emergency, safety_tips, local_customs]
 *     responses:
 *       200:
 *         description: Safety instructions retrieved
 */
router.get('/safety-instructions', auth, async (req, res) => {
  try {
    const { language = 'en', category = 'emergency' } = req.query;

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    const instructions = await getSafetyInstructions(language, category);

    res.json({
      success: true,
      data: {
        language: language,
        languageName: SUPPORTED_LANGUAGES[language],
        category: category,
        instructions: instructions
      }
    });

  } catch (error) {
    console.error('Safety instructions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve safety instructions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/translation/languages:
 *   get:
 *     summary: Get supported languages
 *     tags: [Translation]
 *     responses:
 *       200:
 *         description: Supported languages list
 */
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      supportedLanguages: Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
        code,
        name
      }))
    }
  });
});

/**
 * @swagger
 * /api/translation/detect:
 *   post:
 *     summary: Detect language of text
 *     tags: [Translation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Language detected
 */
router.post('/detect', auth, [
  body('text').trim().isLength({ min: 1, max: 1000 })
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

    const { text } = req.body;

    const detectedLanguage = await detectLanguage(text);

    res.json({
      success: true,
      data: {
        detectedLanguage: detectedLanguage,
        languageName: SUPPORTED_LANGUAGES[detectedLanguage] || 'Unknown',
        confidence: 0.95 // Mock confidence score
      }
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection service unavailable',
      error: error.message
    });
  }
});

// Helper functions
async function performTranslation(text, sourceLanguage, targetLanguage) {
  try {
    // In a real implementation, you would use Google Translate API, Azure Translator, or similar
    // For now, using a mock translation service
    
    if (process.env.TRANSLATION_API_KEY) {
      // Example using Google Translate API
      const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${process.env.TRANSLATION_API_KEY}`, {
        q: text,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        target: targetLanguage,
        format: 'text'
      });

      return response.data.data.translations[0].translatedText;
    } else {
      // Fallback to predefined translations for common phrases
      return getFallbackTranslation(text, targetLanguage);
    }
  } catch (error) {
    console.error('Translation API error:', error);
    throw new Error('Translation failed');
  }
}

function getFallbackTranslation(text, targetLanguage) {
  const commonPhrases = {
    'hi': {
      'help': 'मदद',
      'emergency': 'आपातकाल',
      'police': 'पुलिस',
      'hospital': 'अस्पताल',
      'I need help': 'मुझे मदद चाहिए',
      'Call police': 'पुलिस को बुलाओ',
      'Where is hospital': 'अस्पताल कहाँ है'
    },
    'ta': {
      'help': 'உதவி',
      'emergency': 'அவசரம்',
      'police': 'போலீஸ்',
      'hospital': 'மருத்துவமனை',
      'I need help': 'எனக்கு உதவி வேண்டும்',
      'Call police': 'போலீஸை அழைக்கவும்',
      'Where is hospital': 'மருத்துவமனை எங்கே'
    }
  };

  const translations = commonPhrases[targetLanguage];
  if (translations && translations[text.toLowerCase()]) {
    return translations[text.toLowerCase()];
  }

  return text; // Return original text if no translation available
}

async function detectLanguage(text) {
  // Simple language detection based on script/characters
  // In a real implementation, use a proper language detection service
  
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari script
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil script
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu script
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada script
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam script
  
  return 'en'; // Default to English
}

async function getCachedTranslation(cacheKey) {
  try {
    // In a real implementation, this would check Redis cache
    return null; // Mock implementation
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

async function cacheTranslation(cacheKey, translation) {
  try {
    // In a real implementation, this would store in Redis cache
    console.log(`Caching translation: ${cacheKey}`);
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}

function hashText(text) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(text).digest('hex');
}

async function getEmergencyPhrases(language) {
  const phrases = {
    'en': {
      'help': 'Help!',
      'emergency': 'Emergency!',
      'call_police': 'Call the police',
      'call_ambulance': 'Call an ambulance',
      'i_am_lost': 'I am lost',
      'i_need_doctor': 'I need a doctor',
      'where_is_hospital': 'Where is the nearest hospital?',
      'i_dont_understand': 'I don\'t understand',
      'speak_english': 'Do you speak English?',
      'thank_you': 'Thank you'
    },
    'hi': {
      'help': 'मदद!',
      'emergency': 'आपातकाल!',
      'call_police': 'पुलिस को बुलाओ',
      'call_ambulance': 'एम्बुलेंस बुलाओ',
      'i_am_lost': 'मैं खो गया हूँ',
      'i_need_doctor': 'मुझे डॉक्टर चाहिए',
      'where_is_hospital': 'सबसे नजदीकी अस्पताल कहाँ है?',
      'i_dont_understand': 'मुझे समझ नहीं आ रहा',
      'speak_english': 'क्या आप अंग्रेजी बोलते हैं?',
      'thank_you': 'धन्यवाद'
    },
    'ta': {
      'help': 'உதவி!',
      'emergency': 'அவசரம்!',
      'call_police': 'போலீஸை அழைக்கவும்',
      'call_ambulance': 'ஆம்புலன்ஸை அழைக்கவும்',
      'i_am_lost': 'நான் வழி தொலைத்துவிட்டேன்',
      'i_need_doctor': 'எனக்கு மருத்துவர் வேண்டும்',
      'where_is_hospital': 'அருகிலுள்ள மருத்துவமனை எங்கே?',
      'i_dont_understand': 'எனக்கு புரியவில்லை',
      'speak_english': 'உங்களுக்கு ஆங்கிலம் தெரியுமா?',
      'thank_you': 'நன்றி'
    }
  };

  return phrases[language] || phrases['en'];
}

async function getSafetyInstructions(language, category) {
  const instructions = {
    'en': {
      'first_aid': [
        'Check for responsiveness',
        'Call emergency services (108)',
        'Check breathing and pulse',
        'Apply pressure to bleeding wounds',
        'Keep the person warm and comfortable'
      ],
      'emergency': [
        'Stay calm and assess the situation',
        'Use the SOS button immediately',
        'Move to a safe location if possible',
        'Contact local emergency services',
        'Wait for help to arrive'
      ],
      'safety_tips': [
        'Always inform someone of your whereabouts',
        'Keep emergency contacts readily available',
        'Avoid isolated areas, especially at night',
        'Use official transportation services',
        'Keep copies of important documents'
      ]
    },
    'hi': {
      'first_aid': [
        'प्रतिक्रिया की जाँच करें',
        'आपातकालीन सेवाओं को कॉल करें (108)',
        'सांस और नाड़ी की जांच करें',
        'खून बहने वाले घावों पर दबाव डालें',
        'व्यक्ति को गर्म और आरामदायक रखें'
      ],
      'emergency': [
        'शांत रहें और स्थिति का आकलन करें',
        'तुरंत SOS बटन का उपयोग करें',
        'यदि संभव हो तो सुरक्षित स्थान पर जाएं',
        'स्थानीय आपातकालीन सेवाओं से संपर्क करें',
        'मदद के आने का इंतजार करें'
      ]
    }
  };

  const langInstructions = instructions[language] || instructions['en'];
  return langInstructions[category] || langInstructions['emergency'];
}

module.exports = router;
