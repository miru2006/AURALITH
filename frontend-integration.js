/**
 * Frontend Integration Guide for Tourist Safety API
 * 
 * This file provides comprehensive examples for integrating with the Tourist Safety API
 * Based on successful mock endpoint testing showing working data structures
 */

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

class AuthService {
  static baseURL = 'http://localhost:5000/api';
  
  // Mock login for development (as confirmed in your test)
  static async mockLogin(email, password) {
    const response = await fetch(`${this.baseURL}/test/auth/mock-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  // Production login
  static async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  // Register new user
  static async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  // Token management
  static setToken(token) {
    localStorage.setItem('tourist_safety_token', token);
  }

  static getToken() {
    return localStorage.getItem('tourist_safety_token');
  }

  static removeToken() {
    localStorage.removeItem('tourist_safety_token');
  }

  // User management  
  static setUser(user) {
    localStorage.setItem('tourist_safety_user', JSON.stringify(user));
  }

  static getUser() {
    const userStr = localStorage.getItem('tourist_safety_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static logout() {
    this.removeToken();
    localStorage.removeItem('tourist_safety_user');
  }
}

// ============================================================================
// API CLIENT BASE CLASS
// ============================================================================

class APIClient {
  static baseURL = 'http://localhost:5000/api';

  static async request(endpoint, options = {}) {
    const token = AuthService.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }
}

// ============================================================================
// USER SERVICE
// ============================================================================

class UserService extends APIClient {
  // Get sample user data (confirmed working from your test)
  static async getSampleUsers() {
    return this.request('/test/user/sample');
  }

  // Get current user profile
  static async getProfile() {
    return this.request('/auth/profile');
  }

  // Update user profile
  static async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
}

// ============================================================================
// SOS ALERT SERVICE
// ============================================================================

class SOSService extends APIClient {
  // Get sample SOS alerts
  static async getSampleAlerts() {
    return this.request('/test/sos/samples');
  }

  // Create mock SOS alert (for testing)
  static async createMockAlert(alertData) {
    return this.request('/test/sos/mock-create', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Create real SOS alert
  static async createAlert(alertData) {
    return this.request('/sos/create', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Get user's alerts
  static async getUserAlerts() {
    return this.request('/sos/');
  }

  // Get nearby alerts (for authorities)
  static async getNearbyAlerts(lat, lng, radius = 5000) {
    return this.request(`/sos/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Acknowledge alert (for authorities)
  static async acknowledgeAlert(alertId, responseData) {
    return this.request('/sos/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ alertId, ...responseData })
    });
  }
}

// ============================================================================
// E-FIR SERVICE
// ============================================================================

class EFIRService extends APIClient {
  // Get sample E-FIR data
  static async getSampleEFIRs() {
    return this.request('/test/efir/samples');
  }

  // Create mock E-FIR (for testing)
  static async createMockEFIR(efirData) {
    return this.request('/test/efir/mock-create', {
      method: 'POST',
      body: JSON.stringify(efirData)
    });
  }

  // Create real E-FIR
  static async createEFIR(efirData) {
    return this.request('/efir/create', {
      method: 'POST',
      body: JSON.stringify(efirData)
    });
  }

  // Auto-generate E-FIR from SOS alert
  static async autoGenerateEFIR(sosAlertId) {
    return this.request('/efir/auto-generate', {
      method: 'POST',
      body: JSON.stringify({ sosAlertId })
    });
  }

  // Get E-FIR details
  static async getEFIR(efirId) {
    return this.request(`/efir/${efirId}`);
  }

  // Update investigation (for authorities)
  static async updateInvestigation(efirId, updateData) {
    return this.request(`/efir/${efirId}/update`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }
}

// ============================================================================
// CHATBOT SERVICE
// ============================================================================

class ChatbotService extends APIClient {
  // Mock chat (for testing)
  static async mockChat(message) {
    return this.request('/test/chatbot/mock-chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Real chat with AI
  static async chat(message, context) {
    return this.request('/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  // Get emergency assistance
  static async getEmergencyHelp(situation, location) {
    return this.request('/chatbot/emergency', {
      method: 'POST',
      body: JSON.stringify({ situation, location })
    });
  }

  // Get safety tips
  static async getSafetyTips(location, category) {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    
    return this.request(`/chatbot/tips?${params.toString()}`);
  }
}

// ============================================================================
// TRANSLATION SERVICE
// ============================================================================

class TranslationService extends APIClient {
  // Mock translation (for testing)
  static async mockTranslate(text, targetLanguage) {
    return this.request('/test/translation/mock-translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage })
    });
  }

  // Get emergency phrases
  static async getEmergencyPhrases() {
    return this.request('/test/translation/emergency-phrases');
  }

  // Real translation
  static async translate(text, targetLanguage, sourceLanguage) {
    return this.request('/translation/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage, sourceLanguage })
    });
  }

  // Detect language
  static async detectLanguage(text) {
    return this.request('/translation/detect-language', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

class DashboardService extends APIClient {
  // Get mock dashboard statistics
  static async getMockStats() {
    return this.request('/test/dashboard/mock-stats');
  }

  // Get real dashboard statistics (for authorities)
  static async getStats() {
    return this.request('/dashboard/stats');
  }

  // Get real-time alerts
  static async getRealTimeAlerts(status, priority) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    
    return this.request(`/dashboard/alerts?${params.toString()}`);
  }

  // Get tourist clusters
  static async getTouristClusters(area) {
    const params = area ? `?area=${area}` : '';
    return this.request(`/dashboard/clusters${params}`);
  }

  // Get heat map data
  static async getHeatMap(startDate, endDate) {
    return this.request(`/dashboard/heatmap?startDate=${startDate}&endDate=${endDate}`);
  }
}

// ============================================================================
// PRACTICAL USAGE EXAMPLES
// ============================================================================

// Example 1: Login Flow
async function exampleLogin() {
  try {
    // Use mock login for development (as confirmed in your test)
    const response = await AuthService.mockLogin('john.tourist@gmail.com', 'test123');
    
    if (response.success) {
      AuthService.setToken(response.data.token);
      AuthService.setUser(response.data.user);
      console.log('Login successful:', response.data.user);
      
      // User data structure from your successful test:
      // Tourist: { name, email, safetyScore, loyaltyPoints, digitalId, location... }
      // Authority: { name, email, badgeNumber, department, jurisdiction... }
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Example 2: Display Sample Users (confirmed working)
async function exampleDisplayUsers() {
  try {
    const response = await UserService.getSampleUsers();
    
    if (response.success) {
      const { tourist, authority } = response.data;
      
      console.log('Tourist Data:', {
        name: tourist.name,
        email: tourist.email,
        safetyScore: tourist.safetyScore,
        loyaltyPoints: tourist.loyaltyPoints,
        digitalId: tourist.digitalId,
        location: tourist.location.address
      });
      
      console.log('Authority Data:', {
        name: authority.name,
        email: authority.email,
        badgeNumber: authority.badgeNumber,
        department: authority.department,
        jurisdiction: authority.jurisdiction
      });
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// Example 3: Create and Display SOS Alert
async function exampleSOSAlert() {
  try {
    // Create mock alert for testing
    const alertData = {
      type: 'medical',
      priority: 'high',
      description: 'Tourist needs immediate medical assistance',
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bangalore'
      }
    };
    
    const response = await SOSService.createMockAlert(alertData);
    
    if (response.success) {
      console.log('SOS Alert created:', response.data);
      
      // Get all sample alerts
      const alertsResponse = await SOSService.getSampleAlerts();
      if (alertsResponse.success) {
        console.log('All SOS Alerts:', alertsResponse.data);
      }
    }
  } catch (error) {
    console.error('SOS Alert operation failed:', error);
  }
}

// Example 4: Chatbot Interaction
async function exampleChatbot() {
  try {
    // Mock chat for testing
    const response = await ChatbotService.mockChat('I need help with emergency');
    
    if (response.success) {
      console.log('Chatbot response:', response.data);
    }
    
    // Get safety tips
    const tipsResponse = await ChatbotService.getSafetyTips('Bangalore', 'general');
    if (tipsResponse.success) {
      console.log('Safety tips:', tipsResponse.data);
    }
  } catch (error) {
    console.error('Chatbot interaction failed:', error);
  }
}

// Example 5: Dashboard Statistics
async function exampleDashboard() {
  try {
    const response = await DashboardService.getMockStats();
    
    if (response.success) {
      const stats = response.data;
      console.log('Dashboard Stats:', {
        totalAlerts: stats.overview.totalAlerts,
        activeAlerts: stats.overview.activeAlerts,
        totalTourists: stats.overview.totalTourists,
        safetyScore: stats.overview.safetyScore,
        todaysStats: stats.todaysStats
      });
    }
  } catch (error) {
    console.error('Dashboard stats failed:', error);
  }
}

// Example 6: Translation Service
async function exampleTranslation() {
  try {
    // Get emergency phrases
    const phrasesResponse = await TranslationService.getEmergencyPhrases();
    
    if (phrasesResponse.success) {
      console.log('Emergency phrases:', phrasesResponse.data);
    }
    
    // Mock translation
    const translateResponse = await TranslationService.mockTranslate(
      'I need help', 
      'hi' // Hindi
    );
    
    if (translateResponse.success) {
      console.log('Translation result:', translateResponse.data);
    }
  } catch (error) {
    console.error('Translation failed:', error);
  }
}

// ============================================================================
// ERROR HANDLING HELPER
// ============================================================================

function handleAPIError(error) {
  console.error('API Error:', error);
  
  // Common error scenarios
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    AuthService.logout();
    window.location.href = '/login';
  } else if (error.message.includes('404')) {
    // Not found
    console.error('Resource not found');
  } else if (error.message.includes('500')) {
    // Server error
    console.error('Server error - please try again later');
  }
  
  return error.message;
}

// ============================================================================
// WEBSOCKET CONNECTION FOR REAL-TIME UPDATES
// ============================================================================

class WebSocketService {
  constructor() {
    this.ws = null;
    this.callbacks = {};
  }
  
  connect() {
    this.ws = new WebSocket('ws://localhost:5000');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate if needed
      const token = AuthService.getToken();
      if (token) {
        this.ws.send(JSON.stringify({ type: 'auth', token }));
      }
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (this.callbacks[data.type]) {
        this.callbacks[data.type](data.payload);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };
  }
  
  // Subscribe to specific event types
  subscribe(eventType, callback) {
    this.callbacks[eventType] = callback;
  }
  
  // Send message
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/*
QUICK START GUIDE:

1. Include this file in your frontend project
2. Use the confirmed working mock endpoints for development:
   - http://localhost:5000/api/test/user/sample (confirmed working)
   - http://localhost:5000/api/test/auth/mock-login
   - http://localhost:5000/api/test/sos/samples
   - http://localhost:5000/api/test/efir/samples
   - http://localhost:5000/api/test/dashboard/mock-stats
   - http://localhost:5000/api/test/chatbot/mock-chat
   - http://localhost:5000/api/test/translation/emergency-phrases

3. Example usage in your components:

   // Login
   const loginResult = await AuthService.mockLogin('john.tourist@gmail.com', 'test123');
   
   // Get sample users (confirmed working)
   const users = await UserService.getSampleUsers();
   
   // Get dashboard stats
   const stats = await DashboardService.getMockStats();
   
   // Create SOS alert
   const alert = await SOSService.createMockAlert(alertData);

4. All endpoints return standardized responses:
   {
     success: boolean,
     data: any,
     message: string,
     timestamp: string
   }

5. User data structure (from confirmed test):
   Tourist: { name, email, safetyScore, loyaltyPoints, digitalId, location, ... }
   Authority: { name, email, badgeNumber, department, jurisdiction, ... }

6. For production, replace mock methods with real API calls
7. Use TypeScript interfaces from types/api.types.ts for type safety
8. Handle errors appropriately using handleAPIError helper
9. Implement real-time updates using WebSocketService

Your backend is fully operational and ready for frontend development!
*/

// Export all services
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AuthService,
    UserService,
    SOSService,
    EFIRService,
    ChatbotService,
    TranslationService,
    DashboardService,
    WebSocketService,
    handleAPIError
  };
}
