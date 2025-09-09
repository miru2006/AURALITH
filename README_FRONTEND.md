# Tourist Safety Backend - Frontend Developer Guide

## 🚀 Step 1: Backend Foundations Complete ✅

This backend provides all the foundational APIs needed for frontend development, including comprehensive mock endpoints for testing.

## 📡 Server Status

- **Base URL**: `http://localhost:5000`
- **API Documentation**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`
- **Database**: MongoDB (Connected ✅)
- **Cache**: Redis (Optional - Disabled for development)

## 🔧 Quick Start for Frontend Developers

### 1. Backend is Running
The backend server is already configured and running. No setup needed from frontend team.

### 2. Authentication
All APIs support JWT-based authentication. For testing, use mock login endpoint.

### 3. CORS Enabled
Frontend can make requests from:
- `http://localhost:3000` (React default)
- `http://localhost:3001` (Alternative port)

## 🧪 Mock APIs for Frontend Testing

### Authentication Testing
```javascript
// Mock Login (Returns fake JWT for testing)
POST /api/test/auth/mock-login
Body: {
  "email": "john.tourist@gmail.com",
  "password": "any_password"
}

Response: {
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "mock.jwt.token.{timestamp}",
    "refreshToken": "mock.refresh.token.{timestamp}",
    "expiresIn": "7d"
  }
}
```

### Sample Data Endpoints
```javascript
// Get sample users (tourist & authority)
GET /api/test/user/sample

// Get sample SOS alerts
GET /api/test/sos/samples

// Get sample E-FIR data
GET /api/test/efir/samples

// Get mock dashboard statistics
GET /api/test/dashboard/mock-stats

// Get emergency phrases in local languages
GET /api/test/translation/emergency-phrases
```

### Interactive Mock APIs
```javascript
// Create mock SOS alert
POST /api/test/sos/mock-create
Body: {
  "type": "emergency",
  "description": "Test emergency",
  "location": { "coordinates": [77.5946, 12.9716] }
}

// Create mock E-FIR
POST /api/test/efir/mock-create
Body: {
  "incidentType": "theft",
  "description": "Test incident",
  "location": { "coordinates": [77.5946, 12.9716] }
}

// Mock chatbot interaction
POST /api/test/chatbot/mock-chat
Body: { "message": "I need help" }

// Mock translation
POST /api/test/translation/mock-translate
Body: {
  "text": "Help me",
  "targetLanguage": "hi"
}
```

## 🔗 Production APIs (Real Implementation)

### User Authentication
```javascript
// Register new user
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "tourist", // or "authority"
  "phone": "+1234567890"
}

// User login
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}

// Get user profile (requires auth)
GET /api/auth/profile
Headers: { "Authorization": "Bearer <jwt_token>" }

// Update profile
PUT /api/auth/profile
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: { /* updated user data */ }
```

### SOS Alert System
```javascript
// Create SOS alert (requires auth)
POST /api/sos/create
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "type": "emergency", // "emergency", "medical", "theft", "lost"
  "description": "Detailed description",
  "location": {
    "coordinates": [longitude, latitude],
    "address": "Human readable address"
  },
  "isAnonymous": false
}

// Get user's alerts
GET /api/sos/
Headers: { "Authorization": "Bearer <jwt_token>" }

// Get nearby alerts (for authorities)
GET /api/sos/nearby?lat=12.9716&lng=77.5946&radius=5000
Headers: { "Authorization": "Bearer <jwt_token>" }

// Confirm alert (multi-step process)
POST /api/sos/confirm
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "alertId": "alert_id",
  "confirmationData": { /* confirmation responses */ }
}

// Acknowledge alert (for authorities)
POST /api/sos/acknowledge
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "alertId": "alert_id",
  "estimatedArrival": "2025-09-08T17:00:00.000Z",
  "message": "Help is on the way"
}
```

### E-FIR System
```javascript
// Create E-FIR (requires auth)
POST /api/efir/create
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "incidentType": "theft", // "theft", "fraud", "assault", "harassment", "other"
  "description": "Detailed incident description",
  "incidentDate": "2025-09-08T14:30:00.000Z",
  "location": {
    "coordinates": [longitude, latitude],
    "address": "Incident location"
  },
  "suspects": [/* suspect information */],
  "witnesses": [/* witness information */]
}

// Auto-generate FIR from SOS alert
POST /api/efir/auto-generate
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: { "sosAlertId": "sos_alert_id" }

// Get FIR details
GET /api/efir/:firId
Headers: { "Authorization": "Bearer <jwt_token>" }

// Update investigation (for authorities)
PUT /api/efir/:firId/update
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "update": "Investigation update",
  "status": "under_investigation" // "registered", "under_investigation", "closed"
}

// Upload evidence
POST /api/efir/:firId/evidence
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: FormData with files
```

### Chatbot & AI Services
```javascript
// Chat with AI assistant
POST /api/chatbot/chat
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "message": "User message",
  "context": "emergency" // optional context
}

// Get emergency assistance
POST /api/chatbot/emergency
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "situation": "lost", // "lost", "medical", "crime", "harassment"
  "location": { "coordinates": [lng, lat] }
}

// Get safety tips
GET /api/chatbot/tips?location=bangalore&category=transport
```

### Translation Services
```javascript
// Translate text
POST /api/translation/translate
Body: {
  "text": "Help me please",
  "targetLanguage": "hi", // "hi", "kn", "ta", "te"
  "sourceLanguage": "en" // optional, auto-detected if not provided
}

// Get emergency phrases
GET /api/translation/emergency-phrases/:language

// Detect language
POST /api/translation/detect-language
Body: { "text": "नमस्ते मुझे मदद चाहिए" }
```

### Tourist Services
```javascript
// Generate digital tourist ID
POST /api/tourist/generate-id
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "travelPurpose": "tourism",
  "duration": "7 days",
  "accommodationDetails": { /* hotel info */ }
}

// Update safety score
PUT /api/tourist/safety-score
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "score": 85,
  "factors": ["safe_area", "daylight_travel", "group_travel"]
}

// Add loyalty points
POST /api/tourist/loyalty-points
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "points": 50,
  "reason": "emergency_alert_response",
  "description": "Quick response to emergency"
}
```

### Authority Dashboard
```javascript
// Get dashboard statistics (requires authority role)
GET /api/dashboard/stats
Headers: { "Authorization": "Bearer <jwt_token>" }

// Get real-time alerts
GET /api/dashboard/alerts?status=active&priority=high
Headers: { "Authorization": "Bearer <jwt_token>" }

// Get tourist clusters
GET /api/dashboard/clusters?area=bangalore
Headers: { "Authorization": "Bearer <jwt_token>" }

// Generate heat map data
GET /api/dashboard/heatmap?startDate=2025-09-01&endDate=2025-09-08
Headers: { "Authorization": "Bearer <jwt_token>" }
```

### Anomaly Detection
```javascript
// Detect anomalies in alert patterns
POST /api/anomaly/detect
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "alertData": [/* array of alerts */],
  "timeWindow": "24h"
}

// Get suspicious alerts
GET /api/anomaly/suspicious?threshold=0.8
Headers: { "Authorization": "Bearer <jwt_token>" }

// Batch analyze alerts
POST /api/anomaly/batch-analyze
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "alertIds": ["id1", "id2", "id3"],
  "analysisType": "pattern_recognition"
}
```

## 📱 Frontend Integration Examples

### React Hook for API calls
```javascript
import { useState, useEffect } from 'react';

// Custom hook for API calls
const useAPI = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        });
        
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

// Usage example
const Dashboard = () => {
  const { data: stats, loading } = useAPI('/api/dashboard/stats');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Alerts: {stats?.overview?.totalAlerts}</p>
      <p>Active Alerts: {stats?.overview?.activeAlerts}</p>
    </div>
  );
};
```

### Authentication Service
```javascript
class AuthService {
  static baseURL = 'http://localhost:5000/api';

  static async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const result = await response.json();
    if (result.success) {
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    return result;
  }

  static async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}
```

### SOS Alert Service
```javascript
class SOSService {
  static baseURL = 'http://localhost:5000/api/sos';

  static async createAlert(alertData) {
    const token = AuthService.getToken();
    const response = await fetch(`${this.baseURL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(alertData),
    });
    return response.json();
  }

  static async getUserAlerts() {
    const token = AuthService.getToken();
    const response = await fetch(`${this.baseURL}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  }

  static async getNearbyAlerts(lat, lng, radius = 5000) {
    const token = AuthService.getToken();
    const response = await fetch(
      `${this.baseURL}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    return response.json();
  }
}
```

## 🔍 Testing Endpoints

### Complete Test Endpoint List
```
GET  /api/test/all-endpoints          - List all available test endpoints
GET  /api/test/user/sample            - Sample user data
POST /api/test/auth/mock-login        - Mock authentication
GET  /api/test/sos/samples            - Sample SOS alerts
POST /api/test/sos/mock-create        - Create mock SOS alert
GET  /api/test/efir/samples           - Sample E-FIR data
POST /api/test/efir/mock-create       - Create mock E-FIR
POST /api/test/chatbot/mock-chat      - Mock chatbot responses
POST /api/test/translation/mock-translate - Mock translation
GET  /api/test/translation/emergency-phrases - Emergency phrases
GET  /api/test/dashboard/mock-stats   - Mock dashboard data
```

## 📊 Data Models Reference

### User Object
```javascript
{
  "_id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "tourist", // "tourist" | "authority"
  "phone": "+1234567890",
  "profilePicture": "url_to_image",
  "location": {
    "coordinates": [longitude, latitude],
    "address": "readable_address"
  },
  "safetyScore": 85, // 0-100
  "loyaltyPoints": 250,
  "digitalId": "TST-2025-001234",
  "emergencyContacts": [
    { "name": "Contact Name", "phone": "+1234567890", "relation": "spouse" }
  ],
  "preferences": {
    "language": "en",
    "notifications": true,
    "locationSharing": true
  }
}
```

### SOS Alert Object
```javascript
{
  "_id": "alert_id",
  "userId": "user_id",
  "type": "emergency", // "emergency" | "medical" | "theft" | "lost"
  "description": "Alert description",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude],
    "address": "readable_address"
  },
  "status": "active", // "active" | "acknowledged" | "resolved" | "cancelled"
  "priority": "high", // "low" | "medium" | "high" | "critical"
  "confirmationSteps": [
    {
      "question": "Are you in immediate danger?",
      "answer": "yes",
      "timestamp": "ISO_date_string"
    }
  ],
  "responses": [
    {
      "responderId": "responder_id",
      "responderName": "Responder Name",
      "estimatedArrival": "ISO_date_string",
      "status": "en_route", // "notified" | "en_route" | "arrived" | "completed"
      "message": "Help is on the way",
      "timestamp": "ISO_date_string"
    }
  ],
  "mediaUrls": ["url1", "url2"],
  "isAnonymous": false,
  "createdAt": "ISO_date_string",
  "updatedAt": "ISO_date_string"
}
```

### E-FIR Object
```javascript
{
  "_id": "fir_id",
  "firNumber": "FIR-KA-BLR-2025-001234",
  "complainantId": "user_id",
  "complainantName": "Complainant Name",
  "incidentType": "theft", // "theft" | "fraud" | "assault" | "harassment" | "other"
  "description": "Incident description",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude],
    "address": "incident_location"
  },
  "incidentDate": "ISO_date_string",
  "status": "registered", // "registered" | "under_investigation" | "closed"
  "officerAssigned": {
    "id": "officer_id",
    "name": "Officer Name",
    "badgeNumber": "badge_number",
    "contactNumber": "+phone_number"
  },
  "evidence": [
    {
      "type": "photo", // "photo" | "video" | "document" | "audio"
      "url": "evidence_url",
      "description": "evidence_description",
      "uploadedAt": "ISO_date_string"
    }
  ],
  "investigation": {
    "updates": [
      {
        "date": "ISO_date_string",
        "update": "Investigation update",
        "officer": "Officer Name"
      }
    ],
    "currentStatus": "Current investigation status"
  },
  "priority": "medium", // "low" | "medium" | "high"
  "autoGenerated": false,
  "relatedSOSAlert": "sos_alert_id" // if auto-generated from SOS
}
```

## 🚀 Next Steps for Frontend Team

1. **Start with Mock APIs**: Use `/api/test/*` endpoints for rapid development
2. **Implement Authentication**: Start with mock login, then move to real auth
3. **Build Core Components**: User dashboard, SOS creation, FIR management
4. **Integrate Real APIs**: Gradually replace mock calls with production endpoints
5. **Add Real-time Features**: WebSocket integration for live alerts
6. **Test with Real Data**: Switch to production APIs for final testing

## 📞 Support

- **API Documentation**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`
- **Test Endpoints**: `http://localhost:5000/api/test/all-endpoints`

The backend is fully ready for frontend development! 🎉
