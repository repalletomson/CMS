/**
 * Fresh Database seed script - Creates only essential admin user
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Topic = require('../models/Topic');
const Program = require('../models/Program');
const Term = require('../models/Term');
const Lesson = require('../models/Lesson');
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');

const logger = require('../config/logger');

/**
 * Connect to database
 */
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Clear existing data
 */
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Topic.deleteMany({});
    await Program.deleteMany({});
    await Term.deleteMany({});
    await Lesson.deleteMany({});
    await ProgramAsset.deleteMany({});
    await LessonAsset.deleteMany({});
    logger.info('Cleared existing data');
  } catch (error) {
    logger.error('Error clearing data:', error);
    throw error;
  }
};

/**
 * Create essential users (admin and editor only)
 */
const createEssentialUsers = async () => {
  try {
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        passwordHash: 'admin123', // Will be hashed by pre-save middleware
        role: 'admin',
        isActive: true,
        emailVerified: true
      },
      {
        firstName: 'Editor',
        lastName: 'User',
        email: 'editor@example.com',
        passwordHash: 'editor123', // Will be hashed by pre-save middleware
        role: 'editor',
        isActive: true,
        emailVerified: true
      }
    ];

    // Create users individually to trigger pre-save middleware for password hashing
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }

    logger.info(`Created ${createdUsers.length} essential users`);
    return createdUsers;
  } catch (error) {
    logger.error('Error creating users:', error);
    throw error;
  }
};

/**
 * Create basic topics
 */
const createBasicTopics = async () => {
  try {
    const topics = [
      { name: 'Technology', description: 'Programming, web development, and tech skills' },
      { name: 'Business', description: 'Entrepreneurship, marketing, and business skills' },
      { name: 'Design', description: 'UI/UX, graphic design, and creative skills' },
      { name: 'Science', description: 'Mathematics, physics, and scientific concepts' }
    ];

    const createdTopics = await Topic.insertMany(topics);
    logger.info(`Created ${createdTopics.length} basic topics`);
    return createdTopics;
  } catch (error) {
    logger.error('Error creating topics:', error);
    throw error;
  }
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    logger.info('Starting fresh database seeding...');

    await connectDatabase();
    await clearData();

    const users = await createEssentialUsers();
    const topics = await createBasicTopics();

    logger.info('Fresh database seeding completed successfully!');
    logger.info('Essential login credentials:');
    logger.info('Admin: admin@example.com / admin123');
    logger.info('Editor: editor@example.com / editor123');
    logger.info('');
    logger.info('Users can now:');
    logger.info('- Sign up for viewer accounts at /signup');
    logger.info('- Create courses with YouTube videos');
    logger.info('- Upload custom thumbnails or use auto-generated ones');
    logger.info('- Manage their profiles');

  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the seed script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };