# 🛡️ Tourist Safety Platform - AURALITH

A comprehensive tourist safety web application providing emergency assistance, digital identity management, and real-time safety monitoring for tourists and authorities.

## 🌟 Features

### For Tourists
- **🆔 Digital Identity Management**: Secure tourist digital ID with QR codes
- **🚨 SOS Emergency Alerts**: One-click emergency assistance with location tracking
- **📱 Multi-step Verification**: Prevent false alarms with smart confirmation system
- **🗺️ Real-time Location Sharing**: Share location with emergency contacts
- **📋 E-FIR Filing**: Digital police complaint filing system
- **🌐 Multi-language Support**: Hindi, English, and regional language support
- **🤖 AI Chatbot**: 24/7 assistance and information

### For Authorities
- **👮 Emergency Response Dashboard**: Real-time alert monitoring and response
- **📊 Analytics & Reporting**: Safety statistics and incident analysis
- **🔍 Tourist Tracking**: Monitor tourist safety and location
- **📁 Case Management**: Manage E-FIRs and investigations
- **⚡ Quick Response Tools**: Efficient emergency response workflow

## 🏗️ Technical Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io (planned)
- **File Upload**: Multer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend (Planned Integration)
- **Framework**: React.js with TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI / Tailwind CSS
- **Maps**: Google Maps API / Mapbox
- **Real-time**: Socket.io client

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/miru2006/AURALITH.git
   cd AURALITH
   git checkout kannan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   # Then initialize the database
   node scripts/createDatabase.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
tourist_safety/
├── 📂 models/          # Database schemas
│   ├── User.js         # User model (tourists & authorities)
│   ├── SOSAlert.js     # Emergency alert model
│   └── EFIR.js         # E-FIR model
├── 📂 routes/          # API endpoints
│   ├── auth.js         # Authentication routes
│   ├── sos.js          # SOS alert routes
│   ├── efir.js         # E-FIR routes
│   ├── tourist.js      # Tourist management
│   └── dashboard.js    # Authority dashboard
├── 📂 middleware/      # Custom middleware
│   ├── auth.js         # JWT authentication
│   └── errorHandler.js # Error handling
├── 📂 utils/           # Utility functions
│   ├── logger.js       # Logging system
│   ├── encryption.js   # Data encryption
│   └── notifications.js # SMS/Email notifications
├── 📂 scripts/         # Database scripts
│   └── createDatabase.js # Database initialization
├── 📂 tests/           # Test files
└── server.js           # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### SOS Alerts
- `POST /api/sos/alert` - Create emergency alert
- `GET /api/sos/alerts` - Get user's alerts
- `PUT /api/sos/alert/:id/confirm` - Confirm alert
- `PUT /api/sos/alert/:id/respond` - Authority response

### E-FIR Management
- `POST /api/efir/create` - File new E-FIR
- `GET /api/efir/list` - Get E-FIRs (filtered by user/authority)
- `GET /api/efir/:id` - Get specific E-FIR
- `PUT /api/efir/:id/update` - Update investigation status

### Tourist Management
- `GET /api/tourist/profile` - Get tourist profile
- `PUT /api/tourist/profile` - Update profile
- `GET /api/tourist/safety-score` - Get safety score
- `POST /api/tourist/check-in` - Location check-in

## 🗄️ Database Schema

### Users Collection
- Tourist profiles with digital IDs
- Authority accounts with jurisdiction
- Emergency contacts and preferences
- Safety scores and loyalty points

### SOS Alerts Collection
- Emergency alert details
- Location coordinates
- Multi-step verification data
- Response tracking and resolution

### E-FIRs Collection
- Digital police complaints
- Evidence attachments
- Investigation progress
- Case resolution status

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin security
- **Helmet.js**: Security headers
- **Data Encryption**: Sensitive data protection

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/api.test.js

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourist_safety
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

### Production Checklist
- [ ] Set environment variables
- [ ] Configure MongoDB connection
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: AURALITH Team
- **Backend Development**: Kannan
- **Frontend Development**: Team Members
- **Database Design**: Team Members

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Tourist Safety** 
