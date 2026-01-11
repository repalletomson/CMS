/**
 * Mock database for demonstration without MongoDB
 */
const logger = require('./logger');

// In-memory storage
const mockData = {
  users: [
    {
      _id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      passwordHash: '$2a$12$lc6ipZ3frQMnHsR/9llI7uCQXst.81alEDBHO1eXPaVYp1g.KbBt6', // password123
      role: 'admin',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439012',
      email: 'editor@example.com',
      passwordHash: '$2a$12$lc6ipZ3frQMnHsR/9llI7uCQXst.81alEDBHO1eXPaVYp1g.KbBt6', // password123
      role: 'editor',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439013',
      email: 'viewer@example.com',
      passwordHash: '$2a$12$lc6ipZ3frQMnHsR/9llI7uCQXst.81alEDBHO1eXPaVYp1g.KbBt6', // password123
      role: 'viewer',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ],
  topics: [
    {
      _id: '507f1f77bcf86cd799439021',
      name: 'Mathematics',
      description: 'Mathematical concepts and problem solving',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439022',
      name: 'Science',
      description: 'Scientific principles and experiments',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439023',
      name: 'Technology',
      description: 'Technology and programming concepts',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ],
  programs: [
    {
      _id: '507f1f77bcf86cd799439031',
      title: 'Advanced Mathematics Course',
      description: 'Comprehensive mathematics program covering algebra, geometry, and calculus',
      languagePrimary: 'en',
      languagesAvailable: ['en', 'te'],
      status: 'published',
      publishedAt: new Date('2024-01-15'),
      topicIds: ['507f1f77bcf86cd799439021'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: '507f1f77bcf86cd799439032',
      title: 'Introduction to Computer Science',
      description: 'Basic programming concepts and computer science fundamentals',
      languagePrimary: 'en',
      languagesAvailable: ['en', 'hi'],
      status: 'draft',
      topicIds: ['507f1f77bcf86cd799439023'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ],
  terms: [
    {
      _id: '507f1f77bcf86cd799439041',
      programId: '507f1f77bcf86cd799439031',
      termNumber: 1,
      title: 'Fundamentals',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439042',
      programId: '507f1f77bcf86cd799439032',
      termNumber: 1,
      title: 'Programming Basics',
      createdAt: new Date('2024-01-10')
    }
  ],
  lessons: [
    {
      _id: '507f1f77bcf86cd799439051',
      termId: '507f1f77bcf86cd799439041',
      lessonNumber: 1,
      title: 'Introduction to Algebra',
      contentType: 'video',
      durationMs: 1800000,
      isPaid: false,
      contentLanguagePrimary: 'en',
      contentLanguagesAvailable: ['en', 'te'],
      contentUrlsByLanguage: {
        en: 'https://example.com/videos/algebra-intro-en.mp4',
        te: 'https://example.com/videos/algebra-intro-te.mp4'
      },
      subtitleLanguages: ['en', 'te'],
      subtitleUrlsByLanguage: {
        en: 'https://example.com/subtitles/algebra-intro-en.vtt',
        te: 'https://example.com/subtitles/algebra-intro-te.vtt'
      },
      status: 'published',
      publishedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: '507f1f77bcf86cd799439052',
      termId: '507f1f77bcf86cd799439042',
      lessonNumber: 1,
      title: 'What is Programming?',
      contentType: 'video',
      durationMs: 1200000,
      isPaid: false,
      contentLanguagePrimary: 'en',
      contentLanguagesAvailable: ['en'],
      contentUrlsByLanguage: {
        en: 'https://example.com/videos/programming-intro-en.mp4'
      },
      status: 'draft',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ],
  programAssets: [
    {
      _id: '507f1f77bcf86cd799439061',
      programId: '507f1f77bcf86cd799439031',
      language: 'en',
      variant: 'portrait',
      assetType: 'poster',
      url: 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Math+Course',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439062',
      programId: '507f1f77bcf86cd799439031',
      language: 'en',
      variant: 'landscape',
      assetType: 'poster',
      url: 'https://via.placeholder.com/400x300/4f46e5/ffffff?text=Math+Course',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439063',
      programId: '507f1f77bcf86cd799439032',
      language: 'en',
      variant: 'portrait',
      assetType: 'poster',
      url: 'https://via.placeholder.com/300x400/059669/ffffff?text=CS+Course',
      createdAt: new Date('2024-01-10')
    },
    {
      _id: '507f1f77bcf86cd799439064',
      programId: '507f1f77bcf86cd799439032',
      language: 'en',
      variant: 'landscape',
      assetType: 'poster',
      url: 'https://via.placeholder.com/400x300/059669/ffffff?text=CS+Course',
      createdAt: new Date('2024-01-10')
    }
  ],
  lessonAssets: [
    {
      _id: '507f1f77bcf86cd799439071',
      lessonId: '507f1f77bcf86cd799439051',
      language: 'en',
      variant: 'portrait',
      assetType: 'thumbnail',
      url: 'https://via.placeholder.com/300x400/6366f1/ffffff?text=Algebra',
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '507f1f77bcf86cd799439072',
      lessonId: '507f1f77bcf86cd799439051',
      language: 'en',
      variant: 'landscape',
      assetType: 'thumbnail',
      url: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Algebra',
      createdAt: new Date('2024-01-01')
    }
  ]
};

/**
 * Mock database connection
 */
const connectDatabase = async () => {
  logger.info('Connected to mock database (in-memory storage)');
  return Promise.resolve();
};

/**
 * Mock database health check
 */
const checkDatabaseHealth = async () => {
  return Promise.resolve(true);
};

/**
 * Get mock data
 */
const getMockData = () => mockData;

/**
 * Generate mock ObjectId
 */
const generateId = () => {
  return Math.random().toString(36).substr(2, 24);
};

module.exports = {
  connectDatabase,
  checkDatabaseHealth,
  getMockData,
  generateId
};