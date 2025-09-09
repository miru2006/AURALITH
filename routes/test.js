const express = require('express');
const router = express.Router();
const {
  mockUsers,
  mockSOSAlerts,
  mockEFIRs,
  mockChatbotResponses,
  mockTranslations,
  mockDashboardStats
} = require('../mocks/mockData');

/**
 * @swagger
 * /api/test/user/sample:
 *   get:
 *     summary: Get sample user data for frontend testing
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Sample user data
 */
router.get('/user/sample', (req, res) => {
  res.json({
    success: true,
    data: {
      tourist: mockUsers.find(u => u.role === 'tourist'),
      authority: mockUsers.find(u => u.role === 'authority')
    },
    message: 'Sample user data for frontend testing'
  });
});

/**
 * @swagger
 * /api/test/auth/mock-login:
 *   post:
 *     summary: Mock login for testing (returns fake JWT)
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mock login successful
 */
router.post('/auth/mock-login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email or use default tourist
  let user = mockUsers.find(u => u.email === email) || mockUsers[0];
  
  const mockToken = `mock.jwt.token.${Date.now()}`;
  const mockRefreshToken = `mock.refresh.token.${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture,
        safetyScore: user.safetyScore,
        digitalId: user.digitalId
      },
      token: mockToken,
      refreshToken: mockRefreshToken,
      expiresIn: '7d'
    },
    message: 'Mock login successful'
  });
});

/**
 * @swagger
 * /api/test/sos/samples:
 *   get:
 *     summary: Get sample SOS alerts
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Sample SOS alerts
 */
router.get('/sos/samples', (req, res) => {
  res.json({
    success: true,
    data: mockSOSAlerts,
    total: mockSOSAlerts.length,
    message: 'Sample SOS alerts for frontend testing'
  });
});

/**
 * @swagger
 * /api/test/sos/mock-create:
 *   post:
 *     summary: Mock SOS alert creation
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Mock SOS alert created
 */
router.post('/sos/mock-create', (req, res) => {
  const { type, description, location } = req.body;
  
  const mockAlert = {
    _id: `mock_${Date.now()}`,
    userId: mockUsers[0]._id,
    type: type || 'emergency',
    description: description || 'Test emergency alert',
    location: location || {
      type: "Point",
      coordinates: [77.5946, 12.9716],
      address: "Test Location, Bangalore"
    },
    status: 'active',
    priority: 'high',
    confirmationSteps: [],
    responses: [],
    mediaUrls: [],
    isAnonymous: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: mockAlert,
    message: 'Mock SOS alert created successfully'
  });
});

/**
 * @swagger
 * /api/test/efir/samples:
 *   get:
 *     summary: Get sample E-FIR data
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Sample E-FIR data
 */
router.get('/efir/samples', (req, res) => {
  res.json({
    success: true,
    data: mockEFIRs,
    total: mockEFIRs.length,
    message: 'Sample E-FIR data for frontend testing'
  });
});

/**
 * @swagger
 * /api/test/efir/mock-create:
 *   post:
 *     summary: Mock E-FIR creation
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               incidentType:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Mock E-FIR created
 */
router.post('/efir/mock-create', (req, res) => {
  const { incidentType, description, location } = req.body;
  
  const mockFIR = {
    _id: `mock_fir_${Date.now()}`,
    firNumber: `FIR-MOCK-${Date.now()}`,
    complainantId: mockUsers[0]._id,
    complainantName: mockUsers[0].name,
    incidentType: incidentType || 'theft',
    description: description || 'Test incident report',
    location: location || {
      type: "Point",
      coordinates: [77.5946, 12.9716],
      address: "Test Location, Bangalore"
    },
    incidentDate: new Date().toISOString(),
    status: 'registered',
    officerAssigned: mockUsers.find(u => u.role === 'authority'),
    evidence: [],
    investigation: {
      updates: [
        {
          date: new Date().toISOString(),
          update: "FIR registered successfully",
          officer: "System"
        }
      ],
      currentStatus: "Initial registration completed"
    },
    priority: 'medium',
    autoGenerated: false,
    relatedSOSAlert: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: mockFIR,
    message: 'Mock E-FIR created successfully'
  });
});

/**
 * @swagger
 * /api/test/chatbot/mock-chat:
 *   post:
 *     summary: Mock chatbot response
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mock chatbot response
 */
router.post('/chatbot/mock-chat', (req, res) => {
  const { message } = req.body;
  
  // Simple keyword matching for demo
  let response = mockChatbotResponses[0]; // default emergency response
  
  if (message.toLowerCase().includes('tip') || message.toLowerCase().includes('safe')) {
    response = mockChatbotResponses[1];
  }
  
  res.json({
    success: true,
    data: {
      userMessage: message,
      botResponse: response.botResponse,
      timestamp: new Date().toISOString()
    },
    message: 'Mock chatbot response'
  });
});

/**
 * @swagger
 * /api/test/translation/mock-translate:
 *   post:
 *     summary: Mock translation service
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               targetLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mock translation
 */
router.post('/translation/mock-translate', (req, res) => {
  const { text, targetLanguage } = req.body;
  
  // Mock translation responses
  const translations = {
    'hi': `[Hindi] ${text}`,
    'kn': `[Kannada] ${text}`,
    'ta': `[Tamil] ${text}`,
    'te': `[Telugu] ${text}`
  };
  
  res.json({
    success: true,
    data: {
      originalText: text,
      translatedText: translations[targetLanguage] || `[${targetLanguage}] ${text}`,
      sourceLanguage: 'en',
      targetLanguage: targetLanguage,
      confidence: 0.95
    },
    message: 'Mock translation completed'
  });
});

/**
 * @swagger
 * /api/test/translation/emergency-phrases:
 *   get:
 *     summary: Get emergency phrases in local languages
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Emergency phrases
 */
router.get('/translation/emergency-phrases', (req, res) => {
  res.json({
    success: true,
    data: mockTranslations.help_phrases,
    message: 'Emergency phrases in local languages'
  });
});

/**
 * @swagger
 * /api/test/dashboard/mock-stats:
 *   get:
 *     summary: Get mock dashboard statistics
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Mock dashboard data
 */
router.get('/dashboard/mock-stats', (req, res) => {
  res.json({
    success: true,
    data: mockDashboardStats,
    message: 'Mock dashboard statistics'
  });
});

/**
 * @swagger
 * /api/test/all-endpoints:
 *   get:
 *     summary: Get list of all test endpoints for frontend reference
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: List of test endpoints
 */
router.get('/all-endpoints', (req, res) => {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/test/user/sample',
      description: 'Get sample user data (tourist & authority)'
    },
    {
      method: 'POST',
      path: '/api/test/auth/mock-login',
      description: 'Mock login with fake JWT token',
      body: { email: 'string', password: 'string' }
    },
    {
      method: 'GET',
      path: '/api/test/sos/samples',
      description: 'Get sample SOS alerts'
    },
    {
      method: 'POST',
      path: '/api/test/sos/mock-create',
      description: 'Create mock SOS alert',
      body: { type: 'string', description: 'string', location: 'object' }
    },
    {
      method: 'GET',
      path: '/api/test/efir/samples',
      description: 'Get sample E-FIR data'
    },
    {
      method: 'POST',
      path: '/api/test/efir/mock-create',
      description: 'Create mock E-FIR',
      body: { incidentType: 'string', description: 'string', location: 'object' }
    },
    {
      method: 'POST',
      path: '/api/test/chatbot/mock-chat',
      description: 'Get mock chatbot response',
      body: { message: 'string' }
    },
    {
      method: 'POST',
      path: '/api/test/translation/mock-translate',
      description: 'Mock translation service',
      body: { text: 'string', targetLanguage: 'string' }
    },
    {
      method: 'GET',
      path: '/api/test/translation/emergency-phrases',
      description: 'Get emergency phrases in local languages'
    },
    {
      method: 'GET',
      path: '/api/test/dashboard/mock-stats',
      description: 'Get mock dashboard statistics'
    }
  ];
  
  res.json({
    success: true,
    data: {
      baseUrl: 'http://localhost:5000',
      endpoints: endpoints,
      authHeader: 'Authorization: Bearer mock.jwt.token.{timestamp}',
      note: 'These are mock endpoints for frontend testing. Real endpoints are available under /api/auth, /api/sos, /api/efir, etc.'
    },
    message: 'Complete list of test endpoints for frontend development'
  });
});

module.exports = router;
