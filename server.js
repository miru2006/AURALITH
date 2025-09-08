const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const sosRoutes = require('./routes/sos');
const efirRoutes = require('./routes/efir');
const chatbotRoutes = require('./routes/chatbot');
const translationRoutes = require('./routes/translation');
const touristRoutes = require('./routes/tourist');
const dashboardRoutes = require('./routes/dashboard');
const anomalyRoutes = require('./routes/anomaly');
const testRoutes = require('./routes/test'); // Mock endpoints for frontend testing

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tourist Safety API',
      version: '1.0.0',
      description: 'Smart Tourist Safety Monitoring & Incident Response System API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/efir', efirRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/anomaly', anomalyRoutes);
app.use('/api/test', testRoutes); // Mock endpoints for frontend testing

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use(errorHandler);

// Database connections
async function connectDatabases() {
  try {
    // MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected successfully');

    // Redis connection (optional)
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
      try {
        const redisClient = redis.createClient({
          url: process.env.REDIS_URL
        });
        
        redisClient.on('error', (err) => logger.error('Redis error:', err));
        redisClient.on('connect', () => logger.info('Redis connected successfully'));
        
        await redisClient.connect();
        
        // Make Redis client available globally
        app.set('redisClient', redisClient);
        logger.info('Redis cache enabled');
      } catch (redisError) {
        logger.warn('Redis connection failed, continuing without cache:', redisError.message);
        app.set('redisClient', null);
      }
    } else {
      logger.info('Redis disabled - running without cache');
      app.set('redisClient', null);
    }
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 5000;

connectDatabases().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    server.close(() => {
      logger.info('Process terminated');
    });
  });
});

module.exports = app;
