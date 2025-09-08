// Mock Data for Frontend Testing
// This file provides realistic mock data for all API responses

const mockUsers = [
  {
    _id: "66fd234a8e123456789abcde",
    email: "john.tourist@gmail.com",
    name: "John Smith",
    role: "tourist",
    phone: "+1234567890",
    profilePicture: "https://via.placeholder.com/150/0066cc/ffffff?text=JS",
    location: {
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
      address: "MG Road, Bangalore, Karnataka, India"
    },
    safetyScore: 85,
    loyaltyPoints: 250,
    digitalId: "TST-2025-001234",
    emergencyContacts: [
      { name: "Jane Smith", phone: "+1234567891", relation: "spouse" }
    ],
    preferences: {
      language: "en",
      notifications: true,
      locationSharing: true
    },
    createdAt: "2025-09-01T10:30:00.000Z",
    updatedAt: "2025-09-08T15:45:00.000Z"
  },
  {
    _id: "66fd234a8e123456789abcdf",
    email: "officer.sharma@police.gov.in",
    name: "Inspector Raj Sharma",
    role: "authority",
    phone: "+919876543210",
    profilePicture: "https://via.placeholder.com/150/cc6600/ffffff?text=RS",
    location: {
      coordinates: [77.5946, 12.9716],
      address: "Cubbon Park Police Station, Bangalore"
    },
    badgeNumber: "KA-BLR-2025-001",
    department: "Karnataka Police",
    jurisdiction: "Cubbon Park Division",
    createdAt: "2025-08-15T09:00:00.000Z",
    updatedAt: "2025-09-08T14:20:00.000Z"
  }
];

const mockSOSAlerts = [
  {
    _id: "66fd345b9e234567890bcdef",
    userId: "66fd234a8e123456789abcde",
    type: "emergency",
    description: "Lost in crowded market area, feeling unsafe",
    location: {
      type: "Point",
      coordinates: [77.6033, 12.9698], // Commercial Street, Bangalore
      address: "Commercial Street, Bangalore, Karnataka, India"
    },
    status: "active",
    priority: "high",
    confirmationSteps: [
      {
        question: "Are you in immediate danger?",
        answer: "yes",
        timestamp: "2025-09-08T16:30:00.000Z"
      },
      {
        question: "Can you reach a safe location?",
        answer: "no",
        timestamp: "2025-09-08T16:30:30.000Z"
      }
    ],
    responses: [
      {
        responderId: "66fd234a8e123456789abcdf",
        responderName: "Inspector Raj Sharma",
        estimatedArrival: "2025-09-08T16:45:00.000Z",
        status: "en_route",
        message: "Help is on the way. Stay where you are and keep your phone on.",
        timestamp: "2025-09-08T16:32:00.000Z"
      }
    ],
    mediaUrls: [
      "https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Location+Photo"
    ],
    isAnonymous: false,
    createdAt: "2025-09-08T16:29:45.000Z",
    updatedAt: "2025-09-08T16:32:15.000Z"
  },
  {
    _id: "66fd345b9e234567890bcdf0",
    userId: "66fd234a8e123456789abcde",
    type: "medical",
    description: "Tourist injured in accident, needs immediate medical attention",
    location: {
      type: "Point",
      coordinates: [77.5833, 12.9667], // Lalbagh area
      address: "Lalbagh Botanical Garden, Bangalore, Karnataka, India"
    },
    status: "resolved",
    priority: "critical",
    confirmationSteps: [
      {
        question: "Is someone injured?",
        answer: "yes",
        timestamp: "2025-09-07T14:15:00.000Z"
      }
    ],
    responses: [
      {
        responderId: "66fd234a8e123456789abcdf",
        responderName: "Dr. Priya Kumar",
        estimatedArrival: "2025-09-07T14:25:00.000Z",
        status: "completed",
        message: "Patient transported to Victoria Hospital. Stable condition.",
        timestamp: "2025-09-07T14:45:00.000Z"
      }
    ],
    resolution: {
      outcome: "Medical assistance provided successfully",
      resolvedBy: "Emergency Medical Services",
      resolvedAt: "2025-09-07T15:30:00.000Z"
    },
    createdAt: "2025-09-07T14:14:30.000Z",
    updatedAt: "2025-09-07T15:30:00.000Z"
  }
];

const mockEFIRs = [
  {
    _id: "66fd456c0e345678901cdef1",
    firNumber: "FIR-KA-BLR-2025-001234",
    complainantId: "66fd234a8e123456789abcde",
    complainantName: "John Smith",
    incidentType: "theft",
    description: "Mobile phone and wallet stolen while visiting tourist attraction",
    location: {
      type: "Point",
      coordinates: [77.5833, 12.9667],
      address: "Lalbagh Botanical Garden, Bangalore, Karnataka, India"
    },
    incidentDate: "2025-09-07T10:30:00.000Z",
    status: "under_investigation",
    officerAssigned: {
      id: "66fd234a8e123456789abcdf",
      name: "Inspector Raj Sharma",
      badgeNumber: "KA-BLR-2025-001",
      contactNumber: "+919876543210"
    },
    evidence: [
      {
        type: "photo",
        url: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Evidence+Photo+1",
        description: "CCTV footage showing suspect",
        uploadedAt: "2025-09-07T11:00:00.000Z"
      },
      {
        type: "document",
        url: "https://via.placeholder.com/400x300/45b7d1/ffffff?text=Statement",
        description: "Witness statement",
        uploadedAt: "2025-09-07T11:15:00.000Z"
      }
    ],
    investigation: {
      updates: [
        {
          date: "2025-09-07T12:00:00.000Z",
          update: "CCTV footage obtained from the location",
          officer: "Inspector Raj Sharma"
        },
        {
          date: "2025-09-08T09:00:00.000Z",
          update: "Suspect identified from footage, investigation ongoing",
          officer: "Inspector Raj Sharma"
        }
      ],
      currentStatus: "Suspect identification in progress"
    },
    priority: "medium",
    autoGenerated: false,
    relatedSOSAlert: null,
    createdAt: "2025-09-07T10:45:00.000Z",
    updatedAt: "2025-09-08T09:15:00.000Z"
  }
];

const mockChatbotResponses = [
  {
    scenario: "emergency_help",
    userMessage: "I need help, I'm lost",
    botResponse: {
      message: "I understand you're lost. Let me help you immediately. First, are you in a safe location right now?",
      suggestions: [
        "Yes, I'm safe but lost",
        "No, I don't feel safe",
        "I need immediate police help",
        "I need medical assistance"
      ],
      quickActions: [
        { action: "create_sos", label: "Send SOS Alert" },
        { action: "call_police", label: "Call Police" },
        { action: "find_nearby", label: "Find Nearby Help" }
      ]
    }
  },
  {
    scenario: "safety_tips",
    userMessage: "Give me safety tips for Bangalore",
    botResponse: {
      message: "Here are important safety tips for Bangalore:\n\n🚨 Emergency Numbers:\n• Police: 100\n• Medical: 108\n• Fire: 101\n\n🏙️ Area-specific tips:\n• Avoid isolated areas after dark\n• Keep valuables secure in crowded markets\n• Use official taxi services\n• Stay in well-lit areas\n\n📱 Keep your phone charged and share location with trusted contacts.",
      suggestions: [
        "More about transport safety",
        "Safe areas to visit",
        "Emergency contacts",
        "Local customs to know"
      ]
    }
  }
];

const mockTranslations = {
  "help_phrases": {
    "en": {
      "help": "Help!",
      "police": "Police",
      "hospital": "Hospital",
      "lost": "I am lost",
      "emergency": "Emergency"
    },
    "hi": {
      "help": "मदद!",
      "police": "पुलिस",
      "hospital": "अस्पताल",
      "lost": "मैं खो गया हूँ",
      "emergency": "आपातकाल"
    },
    "kn": {
      "help": "ಸಹಾಯ!",
      "police": "ಪೊಲೀಸ್",
      "hospital": "ಆಸ್ಪತ್ರೆ",
      "lost": "ನಾನು ಕಳೆದುಹೋಗಿದ್ದೇನೆ",
      "emergency": "ತುರ್ತುಸ್ಥಿತಿ"
    }
  }
};

const mockDashboardStats = {
  overview: {
    totalAlerts: 156,
    activeAlerts: 12,
    resolvedAlerts: 144,
    totalTourists: 2847,
    safetyScore: 87.5
  },
  todaysStats: {
    newAlerts: 8,
    newFIRs: 3,
    responseTime: "4.2 minutes",
    touristsHelped: 15
  },
  recentAlerts: mockSOSAlerts,
  alertsByType: {
    emergency: 45,
    medical: 23,
    theft: 67,
    lost: 21
  },
  alertsByHour: [
    { hour: 0, count: 2 },
    { hour: 1, count: 1 },
    { hour: 2, count: 0 },
    { hour: 3, count: 1 },
    { hour: 4, count: 0 },
    { hour: 5, count: 2 },
    { hour: 6, count: 5 },
    { hour: 7, count: 8 },
    { hour: 8, count: 12 },
    { hour: 9, count: 15 },
    { hour: 10, count: 18 },
    { hour: 11, count: 22 },
    { hour: 12, count: 25 },
    { hour: 13, count: 20 },
    { hour: 14, count: 16 },
    { hour: 15, count: 14 },
    { hour: 16, count: 19 },
    { hour: 17, count: 23 },
    { hour: 18, count: 21 },
    { hour: 19, count: 17 },
    { hour: 20, count: 12 },
    { hour: 21, count: 8 },
    { hour: 22, count: 5 },
    { hour: 23, count: 3 }
  ],
  touristClusters: [
    {
      location: { lat: 12.9716, lng: 77.5946 },
      count: 45,
      area: "MG Road & Brigade Road"
    },
    {
      location: { lat: 12.9698, lng: 77.6033 },
      count: 32,
      area: "Commercial Street"
    },
    {
      location: { lat: 12.9667, lng: 77.5833 },
      count: 28,
      area: "Lalbagh"
    }
  ]
};

module.exports = {
  mockUsers,
  mockSOSAlerts,
  mockEFIRs,
  mockChatbotResponses,
  mockTranslations,
  mockDashboardStats
};
