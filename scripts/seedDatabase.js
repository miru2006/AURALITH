const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// Sample data
const sampleUsers = [
  {
    userId: 'TS001ADMIN',
    email: 'admin@touristsafety.com',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '+91-9999999999',
    userType: 'admin',
    isVerified: true,
    authorityProfile: {
      department: 'Tourism Department',
      designation: 'System Administrator',
      badgeNumber: 'ADM001',
      jurisdiction: ['all'],
      accessLevel: 'admin'
    }
  },
  {
    userId: 'TS002AUTH',
    email: 'officer@touristsafety.com',
    password: 'officer123',
    firstName: 'Tourism',
    lastName: 'Officer',
    phoneNumber: '+91-9999999998',
    userType: 'authority',
    isVerified: true,
    authorityProfile: {
      department: 'Tourism Police',
      designation: 'Senior Officer',
      badgeNumber: 'TOP001',
      jurisdiction: ['mumbai', 'pune'],
      accessLevel: 'write'
    }
  },
  {
    userId: 'TS003TOUR',
    email: 'tourist@example.com',
    password: 'tourist123',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+91-9999999997',
    userType: 'tourist',
    isVerified: true,
    touristProfile: {
      digitalId: 'DID1000001',
      nationality: 'USA',
      passportNumber: 'A12345678',
      emergencyContacts: [
        {
          name: 'Jane Doe',
          phone: '+1-555-0123',
          relationship: 'spouse',
          email: 'jane@example.com'
        }
      ],
      tripItinerary: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        destinations: ['Mumbai', 'Goa', 'Kerala'],
        purpose: 'Tourism'
      },
      safetyScore: 95,
      loyaltyPoints: 150,
      preferences: {
        language: 'en',
        enableTracking: true,
        notificationSettings: {
          sms: true,
          email: true,
          push: true
        }
      }
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourist_safety');
    logger.info('Connected to MongoDB for seeding');

    // Clear existing users
    await User.deleteMany({});
    logger.info('Cleared existing users');

    // Create sample users
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      logger.info(`Created user: ${user.email} (${user.userType})`);
    }

    logger.info('Database seeded successfully!');
    logger.info('Sample credentials:');
    logger.info('Admin: admin@touristsafety.com / admin123');
    logger.info('Officer: officer@touristsafety.com / officer123');
    logger.info('Tourist: tourist@example.com / tourist123');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = seedDatabase;
