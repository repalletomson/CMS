/**
 * Publishing Worker Service
 * Handles scheduled lesson publishing
 */
require('dotenv').config();

const cron = require('node-cron');
const mongoose = require('mongoose');
const winston = require('winston');

// Import models (we'll need to copy them or create a shared package)
const Lesson = require('./models/Lesson');
const Term = require('./models/Term');
const Program = require('./models/Program');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cms-worker' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });

    logger.info('Worker connected to MongoDB', {
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Process scheduled lessons for publishing
 */
const processScheduledLessons = async () => {
  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    logger.info('Starting scheduled lesson processing');

    // Find lessons that are scheduled and ready to publish
    const now = new Date();
    const scheduledLessons = await Lesson.find({
      status: 'scheduled',
      publishAt: { $lte: now }
    }).sort({ publishAt: 1 });

    logger.info(`Found ${scheduledLessons.length} lessons ready for publishing`);

    // Process each lesson
    for (const lesson of scheduledLessons) {
      try {
        // Use a transaction to ensure consistency
        const session = await mongoose.startSession();
        
        await session.withTransaction(async () => {
          // Double-check the lesson is still scheduled (prevent race conditions)
          const currentLesson = await Lesson.findById(lesson._id).session(session);
          
          if (!currentLesson || currentLesson.status !== 'scheduled') {
            logger.warn('Lesson status changed during processing', {
              lessonId: lesson._id,
              currentStatus: currentLesson?.status
            });
            return;
          }

          // Validate assets before publishing
          const assetValidation = await currentLesson.validateAssets();
          if (!assetValidation.isValid) {
            logger.error('Cannot publish lesson due to missing assets', {
              lessonId: lesson._id,
              title: lesson.title,
              missingAssets: assetValidation.missingVariants
            });
            errorCount++;
            return;
          }

          // Update lesson to published
          currentLesson.status = 'published';
          currentLesson.publishedAt = new Date();
          currentLesson.publishAt = undefined;
          
          await currentLesson.save({ session });

          // Auto-publish parent program if needed
          const term = await Term.findById(currentLesson.termId).session(session);
          if (term) {
            const program = await Program.findById(term.programId).session(session);
            if (program && program.status === 'draft') {
              program.status = 'published';
              program.publishedAt = program.publishedAt || new Date();
              await program.save({ session });
              
              logger.info('Auto-published parent program', {
                programId: program._id,
                programTitle: program.title
              });
            }
          }

          logger.info('Successfully published lesson', {
            lessonId: lesson._id,
            title: lesson.title,
            scheduledFor: lesson.publishAt,
            publishedAt: currentLesson.publishedAt
          });

          processedCount++;
        });

        await session.endSession();

      } catch (error) {
        logger.error('Error processing lesson', {
          lessonId: lesson._id,
          title: lesson.title,
          error: error.message,
          stack: error.stack
        });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Completed scheduled lesson processing', {
      totalFound: scheduledLessons.length,
      processed: processedCount,
      errors: errorCount,
      duration: `${duration}ms`
    });

  } catch (error) {
    logger.error('Error in scheduled lesson processing:', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Start the worker service
 */
const startWorker = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Schedule the publishing job to run every minute
    const cronExpression = process.env.WORKER_CRON || '* * * * *'; // Every minute
    
    logger.info('Starting publishing worker', {
      cronExpression,
      timezone: process.env.TZ || 'UTC'
    });

    cron.schedule(cronExpression, async () => {
      await processScheduledLessons();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Run once on startup for any missed lessons
    setTimeout(async () => {
      await processScheduledLessons();
    }, 5000);

    logger.info('Publishing worker started successfully');

  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

// Start the worker
startWorker();