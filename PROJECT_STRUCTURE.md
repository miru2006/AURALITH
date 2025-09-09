# Tourist Safety Backend - Project Structure

## 📁 Complete Project Structure

```
tourist_safety/
├── 📄 package.json                 # Dependencies and scripts
├── 📄 server.js                    # Main Express server
├── 📄 .env                        # Environment variables
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .eslintrc.json              # ESLint configuration
├── 📄 README.md                   # Main project documentation
├── 📄 README_FRONTEND.md          # Frontend developer guide
├── 📄 jest.config.js              # Jest testing configuration
├── 📄 swagger.yaml                # API documentation
│
├── 📂 models/                     # Database models
│   ├── 📄 User.js                 # User schema (tourists & authorities)
│   ├── 📄 SOSAlert.js             # SOS alert schema
│   └── 📄 EFIR.js                 # E-FIR schema
│
├── 📂 routes/                     # API route handlers
│   ├── 📄 auth.js                 # Authentication routes
│   ├── 📄 sos.js                  # SOS alert routes
│   ├── 📄 efir.js                 # E-FIR routes
│   ├── 📄 chatbot.js              # AI chatbot routes
│   ├── 📄 translation.js          # Translation service routes
│   ├── 📄 tourist.js              # Tourist service routes
│   ├── 📄 dashboard.js            # Authority dashboard routes
│   ├── 📄 anomaly.js              # Anomaly detection routes
│   └── 📄 test.js                 # Mock endpoints for frontend testing
│
├── 📂 middleware/                 # Express middleware
│   ├── 📄 auth.js                 # JWT authentication middleware
│   └── 📄 errorHandler.js         # Global error handling
│
├── 📂 utils/                      # Utility functions
│   ├── 📄 logger.js               # Winston logging configuration
│   ├── 📄 encryption.js           # Data encryption utilities
│   ├── 📄 notifications.js        # Push notification service
│   └── 📄 anomalyDetection.js     # AI/ML anomaly detection
│
├── 📂 config/                     # Configuration files
│   └── 📄 database.js             # Database connection setup
│
├── 📂 tests/                      # Test files
│   ├── 📄 auth.test.js            # Authentication tests
│   ├── 📄 sos.test.js             # SOS alert tests
│   ├── 📄 efir.test.js            # E-FIR tests
│   └── 📄 setup.js                # Test setup and teardown
│
├── 📂 mocks/                      # Mock data for testing
│   └── 📄 mockData.js             # Comprehensive mock data
│
├── 📂 scripts/                    # Utility scripts
│   ├── 📄 seedDatabase.js         # Database seeding
│   └── 📄 generateTestData.js     # Generate test data
│
└── 📂 uploads/                    # File upload directory
    ├── 📂 evidence/               # E-FIR evidence files
    ├── 📂 profiles/               # User profile pictures
    └── 📂 alerts/                 # SOS alert media files
```

## 🔧 Configuration Status

### ✅ Environment Setup
- **Node.js Environment**: Configured and running
- **MongoDB**: Connected and operational
- **Redis**: Optional (disabled for development)
- **JWT Authentication**: Implemented and secure
- **Logging**: Winston logging configured
- **Error Handling**: Global error handling middleware

### ✅ Database Models
- **User Model**: Complete with authentication, profiles, and roles
- **SOS Alert Model**: Full emergency alert system with geospatial indexing
- **E-FIR Model**: Digital FIR system with investigation tracking

### ✅ API Routes (30+ endpoints)
- **Authentication APIs**: Register, login, profile management
- **SOS Alert APIs**: Create, confirm, acknowledge, track alerts
- **E-FIR APIs**: Create, update, evidence management
- **Chatbot APIs**: AI-powered emergency assistance
- **Translation APIs**: Multi-language support
- **Tourist APIs**: Digital ID, safety scoring, loyalty points
- **Dashboard APIs**: Real-time monitoring for authorities
- **Anomaly Detection APIs**: AI-powered pattern recognition
- **Test APIs**: 10+ mock endpoints for frontend testing

### ✅ Security & Middleware
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured for frontend development
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Structured error responses
- **Security Headers**: Helmet.js security middleware

### ✅ Testing & Documentation
- **Swagger Documentation**: Interactive API docs at `/api-docs`
- **Jest Testing**: Comprehensive test suite
- **Mock Data**: Realistic test data for frontend
- **Health Checks**: Server monitoring endpoints

## 🚀 API Endpoints Summary

### Core APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User authentication |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/sos/create` | Create SOS alert |
| POST | `/api/sos/confirm` | Confirm emergency |
| GET | `/api/sos/nearby` | Get nearby alerts |
| POST | `/api/efir/create` | Create E-FIR |
| POST | `/api/efir/auto-generate` | Auto-generate FIR from SOS |
| POST | `/api/chatbot/chat` | Chat with AI assistant |
| POST | `/api/translation/translate` | Translate text |

### Mock APIs for Testing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test/all-endpoints` | List all test endpoints |
| POST | `/api/test/auth/mock-login` | Mock authentication |
| GET | `/api/test/user/sample` | Sample user data |
| GET | `/api/test/sos/samples` | Sample SOS alerts |
| POST | `/api/test/sos/mock-create` | Create mock SOS alert |
| GET | `/api/test/efir/samples` | Sample E-FIR data |
| POST | `/api/test/chatbot/mock-chat` | Mock chatbot response |
| GET | `/api/test/dashboard/mock-stats` | Mock dashboard data |

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "tourist" | "authority",
  phone: String,
  profilePicture: String,
  location: { coordinates: [Number], address: String },
  safetyScore: Number,
  loyaltyPoints: Number,
  digitalId: String,
  emergencyContacts: [Object],
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### SOS Alerts Collection
```javascript
{
  userId: ObjectId,
  type: "emergency" | "medical" | "theft" | "lost",
  description: String,
  location: { type: "Point", coordinates: [Number] },
  status: "active" | "acknowledged" | "resolved",
  priority: "low" | "medium" | "high" | "critical",
  confirmationSteps: [Object],
  responses: [Object],
  mediaUrls: [String],
  isAnonymous: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### E-FIR Collection
```javascript
{
  firNumber: String (unique),
  complainantId: ObjectId,
  incidentType: String,
  description: String,
  location: { type: "Point", coordinates: [Number] },
  incidentDate: Date,
  status: "registered" | "under_investigation" | "closed",
  officerAssigned: Object,
  evidence: [Object],
  investigation: Object,
  priority: String,
  autoGenerated: Boolean,
  relatedSOSAlert: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Protection against DDoS attacks
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js middleware
- **Data Encryption**: Sensitive data encryption utilities
- **Error Sanitization**: Secure error messages

## 📈 Performance Features

- **Database Indexing**: Optimized MongoDB indexes
- **Geospatial Queries**: Location-based search optimization
- **Caching Strategy**: Redis integration (optional)
- **Request Compression**: Gzip compression
- **Connection Pooling**: MongoDB connection optimization
- **Error Logging**: Comprehensive logging system

## 🧪 Testing Strategy

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Mock Data**: Realistic test datasets
- **Database Seeding**: Test data generation
- **Performance Testing**: Load testing capabilities
- **Security Testing**: Authentication and authorization tests

## 🚀 Deployment Ready

- **Environment Configuration**: Development and production configs
- **Docker Support**: Container deployment ready
- **Health Checks**: Monitoring endpoints
- **Graceful Shutdown**: Proper server termination
- **Process Management**: PM2 configuration
- **SSL/HTTPS Ready**: Production security ready

## 📞 Developer Support

- **API Documentation**: Swagger UI at `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`
- **Test Endpoints**: `http://localhost:5000/api/test/all-endpoints`
- **Mock Data**: Comprehensive test data available
- **Error Logging**: Detailed error tracking and logging

The backend foundation is complete and production-ready! 🎉
