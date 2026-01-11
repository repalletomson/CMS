/**
 * MongoDB initialization script
 * Creates database and initial collections with indexes
 */

// Switch to the CMS database
db = db.getSiblingDB('cms_db');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        passwordHash: { bsonType: 'string' },
        role: {
          bsonType: 'string',
          enum: ['admin', 'editor', 'viewer']
        }
      }
    }
  }
});

db.createCollection('topics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        name: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('programs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'languagePrimary', 'languagesAvailable', 'status'],
      properties: {
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        languagePrimary: { bsonType: 'string' },
        languagesAvailable: {
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        status: {
          bsonType: 'string',
          enum: ['draft', 'published', 'archived']
        },
        topicIds: {
          bsonType: 'array',
          items: { bsonType: 'objectId' }
        }
      }
    }
  }
});

db.createCollection('terms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['programId', 'termNumber'],
      properties: {
        programId: { bsonType: 'objectId' },
        termNumber: { bsonType: 'int' },
        title: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('lessons', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['termId', 'lessonNumber', 'title', 'contentType', 'contentLanguagePrimary', 'contentLanguagesAvailable', 'contentUrlsByLanguage', 'status'],
      properties: {
        termId: { bsonType: 'objectId' },
        lessonNumber: { bsonType: 'int' },
        title: { bsonType: 'string' },
        contentType: {
          bsonType: 'string',
          enum: ['video', 'article']
        },
        durationMs: { bsonType: 'int' },
        isPaid: { bsonType: 'bool' },
        contentLanguagePrimary: { bsonType: 'string' },
        contentLanguagesAvailable: {
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        contentUrlsByLanguage: { bsonType: 'object' },
        subtitleLanguages: {
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        subtitleUrlsByLanguage: { bsonType: 'object' },
        status: {
          bsonType: 'string',
          enum: ['draft', 'scheduled', 'published', 'archived']
        },
        publishAt: { bsonType: 'date' },
        publishedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('programAssets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['programId', 'language', 'variant', 'assetType', 'url'],
      properties: {
        programId: { bsonType: 'objectId' },
        language: { bsonType: 'string' },
        variant: {
          bsonType: 'string',
          enum: ['portrait', 'landscape', 'square', 'banner']
        },
        assetType: {
          bsonType: 'string',
          enum: ['poster']
        },
        url: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('lessonAssets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['lessonId', 'language', 'variant', 'assetType', 'url'],
      properties: {
        lessonId: { bsonType: 'objectId' },
        language: { bsonType: 'string' },
        variant: {
          bsonType: 'string',
          enum: ['portrait', 'landscape', 'square', 'banner']
        },
        assetType: {
          bsonType: 'string',
          enum: ['thumbnail']
        },
        url: { bsonType: 'string' }
      }
    }
  }
});

// Create indexes for performance
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Topics
db.topics.createIndex({ name: 1 }, { unique: true });

// Programs
db.programs.createIndex({ status: 1, languagePrimary: 1, publishedAt: -1 });
db.programs.createIndex({ topicIds: 1 });
db.programs.createIndex({ createdAt: -1 });

// Terms
db.terms.createIndex({ programId: 1, termNumber: 1 }, { unique: true });
db.terms.createIndex({ programId: 1 });

// Lessons
db.lessons.createIndex({ termId: 1, lessonNumber: 1 }, { unique: true });
db.lessons.createIndex({ status: 1, publishAt: 1 });
db.lessons.createIndex({ status: 1, publishedAt: -1 });
db.lessons.createIndex({ termId: 1 });

// Assets
db.programAssets.createIndex({ programId: 1, language: 1, variant: 1, assetType: 1 }, { unique: true });
db.programAssets.createIndex({ programId: 1 });

db.lessonAssets.createIndex({ lessonId: 1, language: 1, variant: 1, assetType: 1 }, { unique: true });
db.lessonAssets.createIndex({ lessonId: 1 });

print('MongoDB initialization completed successfully!');