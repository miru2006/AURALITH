// Frontend Integration Examples - Tourist Safety API
// Based on successful mock endpoint testing

import { 
  User, Tourist, Authority, SOSAlert, EFIR, 
  ApiResponse, AuthResponse, DashboardStats 
} from './types/api.types';

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

class AuthService {
  private static baseURL = 'http://localhost:5000/api';
  
  // Mock login for development (as shown in your test)
  static async mockLogin(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${this.baseURL}/test/auth/mock-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  // Production login
  static async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  // Register new user
  static async register(userData: any): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  // Token management
  static setToken(token: string): void {
    localStorage.setItem('tourist_safety_token', token);
  }

  static getToken(): string | null {
    return localStorage.getItem('tourist_safety_token');
  }

  static removeToken(): void {
    localStorage.removeItem('tourist_safety_token');
  }

  // User management
  static setUser(user: Tourist | Authority): void {
    localStorage.setItem('tourist_safety_user', JSON.stringify(user));
  }

  static getUser(): Tourist | Authority | null {
    const userStr = localStorage.getItem('tourist_safety_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static logout(): void {
    this.removeToken();
    localStorage.removeItem('tourist_safety_user');
  }
}

// ============================================================================
// API CLIENT BASE CLASS
// ============================================================================

class APIClient {
  private static baseURL = 'http://localhost:5000/api';

  protected static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthService.getToken();
    
    const config: RequestInit = {
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
  // Get sample user data (from your successful test)
  static async getSampleUsers(): Promise<ApiResponse<{tourist: Tourist, authority: Authority}>> {
    return this.request('/test/user/sample');
  }

  // Get current user profile
  static async getProfile(): Promise<ApiResponse<Tourist | Authority>> {
    return this.request('/auth/profile');
  }

  // Update user profile
  static async updateProfile(userData: Partial<Tourist | Authority>): Promise<ApiResponse<Tourist | Authority>> {
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
  static async getSampleAlerts(): Promise<ApiResponse<SOSAlert[]>> {
    return this.request('/test/sos/samples');
  }

  // Create mock SOS alert (for testing)
  static async createMockAlert(alertData: any): Promise<ApiResponse<SOSAlert>> {
    return this.request('/test/sos/mock-create', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Create real SOS alert
  static async createAlert(alertData: any): Promise<ApiResponse<SOSAlert>> {
    return this.request('/sos/create', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Get user's alerts
  static async getUserAlerts(): Promise<ApiResponse<SOSAlert[]>> {
    return this.request('/sos/');
  }

  // Get nearby alerts (for authorities)
  static async getNearbyAlerts(lat: number, lng: number, radius: number = 5000): Promise<ApiResponse<SOSAlert[]>> {
    return this.request(`/sos/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Acknowledge alert (for authorities)
  static async acknowledgeAlert(alertId: string, responseData: any): Promise<ApiResponse<SOSAlert>> {
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
  static async getSampleEFIRs(): Promise<ApiResponse<EFIR[]>> {
    return this.request('/test/efir/samples');
  }

  // Create mock E-FIR (for testing)
  static async createMockEFIR(efirData: any): Promise<ApiResponse<EFIR>> {
    return this.request('/test/efir/mock-create', {
      method: 'POST',
      body: JSON.stringify(efirData)
    });
  }

  // Create real E-FIR
  static async createEFIR(efirData: any): Promise<ApiResponse<EFIR>> {
    return this.request('/efir/create', {
      method: 'POST',
      body: JSON.stringify(efirData)
    });
  }

  // Auto-generate E-FIR from SOS alert
  static async autoGenerateEFIR(sosAlertId: string): Promise<ApiResponse<EFIR>> {
    return this.request('/efir/auto-generate', {
      method: 'POST',
      body: JSON.stringify({ sosAlertId })
    });
  }

  // Get E-FIR details
  static async getEFIR(efirId: string): Promise<ApiResponse<EFIR>> {
    return this.request(`/efir/${efirId}`);
  }

  // Update investigation (for authorities)
  static async updateInvestigation(efirId: string, updateData: any): Promise<ApiResponse<EFIR>> {
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
  static async mockChat(message: string): Promise<ApiResponse<any>> {
    return this.request('/test/chatbot/mock-chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Real chat with AI
  static async chat(message: string, context?: string): Promise<ApiResponse<any>> {
    return this.request('/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  // Get emergency assistance
  static async getEmergencyHelp(situation: string, location?: any): Promise<ApiResponse<any>> {
    return this.request('/chatbot/emergency', {
      method: 'POST',
      body: JSON.stringify({ situation, location })
    });
  }

  // Get safety tips
  static async getSafetyTips(location?: string, category?: string): Promise<ApiResponse<any>> {
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
  static async mockTranslate(text: string, targetLanguage: string): Promise<ApiResponse<any>> {
    return this.request('/test/translation/mock-translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage })
    });
  }

  // Get emergency phrases
  static async getEmergencyPhrases(): Promise<ApiResponse<any>> {
    return this.request('/test/translation/emergency-phrases');
  }

  // Real translation
  static async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<ApiResponse<any>> {
    return this.request('/translation/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage, sourceLanguage })
    });
  }

  // Detect language
  static async detectLanguage(text: string): Promise<ApiResponse<any>> {
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
  static async getMockStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/test/dashboard/mock-stats');
  }

  // Get real dashboard statistics (for authorities)
  static async getStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }

  // Get real-time alerts
  static async getRealTimeAlerts(status?: string, priority?: string): Promise<ApiResponse<SOSAlert[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    
    return this.request(`/dashboard/alerts?${params.toString()}`);
  }

  // Get tourist clusters
  static async getTouristClusters(area?: string): Promise<ApiResponse<any>> {
    const params = area ? `?area=${area}` : '';
    return this.request(`/dashboard/clusters${params}`);
  }

  // Get heat map data
  static async getHeatMap(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/heatmap?startDate=${startDate}&endDate=${endDate}`);
  }
}

// ============================================================================
// REACT HOOKS FOR EASY INTEGRATION
// ============================================================================

// Custom hook for API calls
export function useAPI<T>(apiCall: () => Promise<ApiResponse<T>>, dependencies: any[] = []) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall();
        
        if (isMounted) {
          setData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error };
}

// ============================================================================
// EXAMPLE REACT COMPONENTS
// ============================================================================

// Login Component Example
export function LoginComponent() {
  const [email, setEmail] = React.useState('john.tourist@gmail.com');
  const [password, setPassword] = React.useState('test123');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use mock login for development
      const response = await AuthService.mockLogin(email, password);
      
      if (response.success) {
        AuthService.setToken(response.data.token);
        AuthService.setUser(response.data.user);
        console.log('Login successful:', response.data.user);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// Sample Users Display Component
export function SampleUsersComponent() {
  const { data: users, loading, error } = useAPI(() => UserService.getSampleUsers());

  if (loading) return <div>Loading sample users...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!users) return <div>No data available</div>;

  return (
    <div>
      <h2>Sample Users</h2>
      
      <div className="user-card">
        <h3>Tourist: {users.tourist.name}</h3>
        <p>Email: {users.tourist.email}</p>
        <p>Safety Score: {users.tourist.safetyScore}</p>
        <p>Loyalty Points: {users.tourist.loyaltyPoints}</p>
        <p>Digital ID: {users.tourist.digitalId}</p>
        <p>Location: {users.tourist.location.address}</p>
      </div>

      <div className="user-card">
        <h3>Authority: {users.authority.name}</h3>
        <p>Email: {users.authority.email}</p>
        <p>Badge: {users.authority.badgeNumber}</p>
        <p>Department: {users.authority.department}</p>
        <p>Jurisdiction: {users.authority.jurisdiction}</p>
      </div>
    </div>
  );
}

// SOS Alerts Dashboard Component
export function SOSAlertsComponent() {
  const { data: alerts, loading, error } = useAPI(() => SOSService.getSampleAlerts());

  if (loading) return <div>Loading SOS alerts...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!alerts) return <div>No alerts available</div>;

  return (
    <div>
      <h2>SOS Alerts</h2>
      {alerts.map((alert) => (
        <div key={alert._id} className="alert-card">
          <h4>{alert.type.toUpperCase()} - {alert.priority}</h4>
          <p>{alert.description}</p>
          <p>Status: {alert.status}</p>
          <p>Location: {alert.location.address}</p>
          <p>Created: {new Date(alert.createdAt).toLocaleString()}</p>
          {alert.responses.length > 0 && (
            <div>
              <h5>Responses:</h5>
              {alert.responses.map((response, idx) => (
                <p key={idx}>{response.responderName}: {response.message}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Dashboard Statistics Component
export function DashboardStatsComponent() {
  const { data: stats, loading, error } = useAPI(() => DashboardService.getMockStats());

  if (loading) return <div>Loading dashboard stats...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No stats available</div>;

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Alerts</h3>
          <p>{stats.overview.totalAlerts}</p>
        </div>
        <div className="stat-card">
          <h3>Active Alerts</h3>
          <p>{stats.overview.activeAlerts}</p>
        </div>
        <div className="stat-card">
          <h3>Total Tourists</h3>
          <p>{stats.overview.totalTourists}</p>
        </div>
        <div className="stat-card">
          <h3>Safety Score</h3>
          <p>{stats.overview.safetyScore}%</p>
        </div>
      </div>

      <div className="todays-stats">
        <h3>Today's Statistics</h3>
        <p>New Alerts: {stats.todaysStats.newAlerts}</p>
        <p>New FIRs: {stats.todaysStats.newFIRs}</p>
        <p>Average Response Time: {stats.todaysStats.responseTime}</p>
        <p>Tourists Helped: {stats.todaysStats.touristsHelped}</p>
      </div>
    </div>
  );
}

// Export all services for easy use
export {
  AuthService,
  UserService,
  SOSService,
  EFIRService,
  ChatbotService,
  TranslationService,
  DashboardService,
};
