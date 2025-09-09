const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');
const EFIR = require('../models/EFIR');
require('dotenv').config();

async function createDatabase() {
  try {
    console.log('🚀 Starting MongoDB database creation...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB successfully');

    // Check if database already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('⚠️  Database already has data. Clearing existing data...');
      await User.deleteMany({});
      await SOSAlert.deleteMany({});
      await EFIR.deleteMany({});
      console.log('🧹 Cleared existing data');
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hashed');

    // Create users
    console.log('👥 Creating users...');
    const users = [
      {
        userId: 'TST-2025-001234',
        userType: 'tourist',
        email: 'john.tourist@gmail.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '+1234567890',
        profileImage: 'https://via.placeholder.com/150/0066cc/ffffff?text=JS',
        touristProfile: {
          digitalId: 'TST-2025-001234',
          nationality: 'USA',
          emergencyContacts: [{
            name: 'Jane Smith',
            phone: '+1234567891',
            relationship: 'spouse',
            email: 'jane.smith@gmail.com'
          }],
          safetyScore: 85,
          loyaltyPoints: 250,
          preferences: {
            language: 'en',
            enableTracking: true,
            notificationSettings: {
              sms: true,
              email: true,
              push: true
            }
          }
        },
        isActive: true,
        isVerified: true
      },
      {
        userId: 'AUTH-KA-BLR-001',
        userType: 'authority',
        email: 'officer.sharma@police.gov.in',
        password: hashedPassword,
        firstName: 'Raj',
        lastName: 'Sharma',
        phoneNumber: '+919876543210',
        profileImage: 'https://via.placeholder.com/150/cc6600/ffffff?text=RS',
        authorityProfile: {
          department: 'Karnataka Police',
          designation: 'Inspector',
          badgeNumber: 'KA-BLR-2025-001',
          jurisdiction: ['Cubbon Park Division', 'MG Road'],
          accessLevel: 'write'
        },
        isActive: true,
        isVerified: true
      },
      {
        userId: 'TST-2025-001235',
        userType: 'tourist',
        email: 'maria.tourist@gmail.com',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Garcia',
        phoneNumber: '+1234567892',
        profileImage: 'https://via.placeholder.com/150/ff6b6b/ffffff?text=MG',
        touristProfile: {
          digitalId: 'TST-2025-001235',
          nationality: 'Spain',
          emergencyContacts: [{
            name: 'Carlos Garcia',
            phone: '+1234567893',
            relationship: 'husband',
            email: 'carlos.garcia@gmail.com'
          }],
          safetyScore: 92,
          loyaltyPoints: 150,
          preferences: {
            language: 'hi',
            enableTracking: false,
            notificationSettings: {
              sms: true,
              email: true,
              push: false
            }
          }
        },
        isActive: true,
        isVerified: true
      },
      {
        userId: 'AUTH-KA-BLR-002',
        userType: 'authority',
        email: 'sub.inspector@police.gov.in',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Kumar',
        phoneNumber: '+919876543211',
        profileImage: 'https://via.placeholder.com/150/4ecdc4/ffffff?text=PK',
        authorityProfile: {
          department: 'Karnataka Police',
          designation: 'Sub Inspector',
          badgeNumber: 'KA-BLR-2025-002',
          jurisdiction: ['Commercial Street Division', 'Brigade Road'],
          accessLevel: 'write'
        },
        isActive: true,
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create SOS Alerts
    console.log('🚨 Creating SOS alerts...');
    const sosAlerts = [
      {
        alertId: 'SOS-2025-001',
        userId: createdUsers[0].userId, // John Smith's userId
        touristName: 'John Smith',
        alertType: 'emergency',
        priority: 'high',
        status: 'pending',
        location: {
          type: 'Point',
          coordinates: [77.6033, 12.9698] // [longitude, latitude]
        },
        address: 'Commercial Street, Bangalore, Karnataka, India',
        landmark: 'Near Commercial Street Metro Station',
        message: 'Lost in crowded market area, feeling unsafe',
        description: 'Tourist lost in crowded market area, feeling unsafe and needs immediate assistance',
        mediaFiles: [],
        confirmation: {
          isConfirmed: true,
          verificationMethod: 'sms',
          verificationCode: '1234',
          confirmedAt: new Date()
        }
      },
      {
        alertId: 'SOS-2025-002',
        userId: createdUsers[2].userId, // Maria Garcia's userId
        touristName: 'Maria Garcia',
        alertType: 'medical',
        priority: 'critical',
        status: 'resolved',
        location: {
          type: 'Point',
          coordinates: [77.5833, 12.9667] // [longitude, latitude]
        },
        address: 'Lalbagh Botanical Garden, Bangalore, Karnataka, India',
        landmark: 'Main Gate, Lalbagh',
        message: 'Tourist injured in accident, needs immediate medical attention',
        description: 'Tourist injured in accident near Lalbagh main gate, medical assistance required',
        mediaFiles: [],
        confirmation: {
          isConfirmed: true,
          verificationMethod: 'call',
          verificationCode: '5678',
          confirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        response: {
          respondingOfficer: {
            userId: createdUsers[3].userId, // Sub Inspector Priya's userId
            name: 'Sub Inspector Priya Kumar',
            badgeNumber: 'KA-BLR-2025-002',
            contact: '+919876543211'
          },
          dispatchTime: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
          arrivalTime: new Date(Date.now() - 75 * 60 * 1000), // 75 minutes ago
          status: 'completed',
          notes: 'Medical assistance provided successfully, tourist transferred to hospital'
        },
        resolution: {
          resolvedBy: 'Emergency Medical Services',
          resolutionTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          outcome: 'medical_attention',
          notes: 'Emergency medical services contacted, patient stabilized and transferred to nearest hospital',
          followUpRequired: true
        }
      }
    ];

    const createdAlerts = await SOSAlert.insertMany(sosAlerts);
    console.log(`✅ Created ${createdAlerts.length} SOS alerts`);

    // Create E-FIRs
    console.log('📋 Creating E-FIRs...');
    const efirs = [
      {
        firNumber: 'FIR-KA-BLR-2025-001234',
        complainant: {
          userId: createdUsers[0].userId, // John Smith's userId
          name: 'John Smith',
          contact: {
            phone: '+1234567890',
            email: 'john.tourist@gmail.com'
          },
          address: 'Tourist visiting from USA',
          relationship: 'self'
        },
        incidentType: 'theft',
        victim: {
          name: 'John Smith',
          age: 32,
          gender: 'male',
          nationality: 'USA',
          digitalId: 'TST-2025-001234',
          lastKnownLocation: {
            type: 'Point',
            coordinates: [77.5833, 12.9667] // Same as incident location
          },
          physicalDescription: 'Medium height, brown hair, wearing blue jeans and white t-shirt',
          clothingDescription: 'Blue jeans, white t-shirt, black backpack'
        },
        incidentLocation: {
          type: 'Point',
          coordinates: [77.5833, 12.9667] // [longitude, latitude]
        },
        incidentAddress: 'Lalbagh Botanical Garden, Bangalore, Karnataka, India',
        incidentTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        description: 'Mobile phone (iPhone 14) and wallet containing cash and credit cards were stolen while the complainant was visiting the Rose Garden section of Lalbagh Botanical Garden. The incident occurred during daytime hours when the garden was moderately crowded with visitors.',
        circumstances: 'The complainant was taking photographs near the Rose Garden when distracted by someone asking for directions. During this distraction, another person approached from behind and took the items from the complainant\'s backpack.',
        suspectDescription: 'Two males, approximately 25-30 years old, medium height, wearing casual clothing. One suspect wore a blue shirt, the other a red t-shirt.',
        witnessDetails: ['Garden security guard who witnessed the incident', 'Another tourist who saw the suspects fleeing'],
        status: 'under_investigation',
        priority: 'medium',
        assignedOfficer: {
          userId: createdUsers[1].userId, // Inspector Raj Sharma's userId
          name: 'Inspector Raj Sharma',
          badgeNumber: 'KA-BLR-2025-001',
          contact: '+919876543210',
          department: 'Karnataka Police'
        },
        evidence: [
          {
            type: 'document',
            description: 'CCTV footage from Lalbagh security cameras',
            fileUrl: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=CCTV+Evidence',
            collectedBy: 'Inspector Raj Sharma',
            collectionTime: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
          }
        ],
        investigation: {
          currentStatus: 'Evidence collection phase',
          updates: [
            {
              date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
              update: 'CCTV footage obtained from Lalbagh security office',
              updatedBy: 'Inspector Raj Sharma',
              actionTaken: 'Reviewed security footage, identified potential suspect'
            },
            {
              date: new Date(),
              update: 'Suspect identification in progress, cross-referencing with criminal database',
              updatedBy: 'Inspector Raj Sharma',
              actionTaken: 'Forensic analysis of footage ongoing'
            }
          ]
        },
        autoGenerated: false
      }
    ];

    const createdEfirs = await EFIR.insertMany(efirs);
    console.log(`✅ Created ${createdEfirs.length} E-FIRs`);

    // Skip manual index creation since models define their own indexes
    console.log('📊 Skipping manual index creation (models handle this automatically)');
    
    console.log('✅ Database indexes handled by model schemas');

    // Get final statistics
    const userCount = await User.countDocuments();
    const alertCount = await SOSAlert.countDocuments();
    const efirCount = await EFIR.countDocuments();

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('\n🎉 DATABASE CREATION SUCCESSFUL!');
    console.log('=' .repeat(50));
    console.log('📊 Database Statistics:');
    console.log(`   Database Name: ${mongoose.connection.name}`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🚨 SOS Alerts: ${alertCount}`);
    console.log(`   📋 E-FIRs: ${efirCount}`);
    console.log('\n📁 Collections Created:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Tourist 1: john.tourist@gmail.com / password123');
    console.log('   Tourist 2: maria.tourist@gmail.com / password123');
    console.log('   Authority 1: officer.sharma@police.gov.in / password123');
    console.log('   Authority 2: sub.inspector@police.gov.in / password123');
    
    console.log('\n🔍 View in MongoDB Compass:');
    console.log(`   Connection: ${process.env.MONGODB_URI}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    
    console.log('\n✅ You can now start your server with: npm start');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the database creation
createDatabase();
