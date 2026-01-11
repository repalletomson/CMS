/**
 * Catalog controller for public API
 */
const Program = require('../models/Program');
const Term = require('../models/Term');
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * Set cache headers
 */
const setCacheHeaders = (res, maxAge = 300) => {
  res.set({
    'Cache-Control': `public, max-age=${maxAge}`,
    'ETag': `"${Date.now()}"`,
    'Last-Modified': new Date().toUTCString()
  });
};

/**
 * GET /catalog/programs
 * Get published programs with filtering and pagination
 */
const getPrograms = async (req, res, next) => {
  try {
    const {
      language,
      topic,
      cursor,
      limit = 20
    } = req.query;

    // Build cache key
    const cacheKey = `catalog:programs:${JSON.stringify(req.query)}`;
    const redis = getRedisClient();

    // Try to get from cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          setCacheHeaders(res, 300);
          return res.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        logger.warn('Cache read error:', cacheError);
      }
    }

    // Build filter - only published programs with published lessons
    const filter = { status: 'published' };
    
    if (language) filter.languagePrimary = language;
    
    // Handle topic filter
    if (topic) {
      const topicDoc = await Topic.findOne({ name: topic });
      if (topicDoc) {
        filter.topicIds = topicDoc._id;
      }
    }

    // Handle cursor pagination
    if (cursor) {
      filter._id = { $gt: cursor };
    }

    // Get programs
    let programs = await Program.find(filter)
      .populate('topicIds', 'name')
      .sort({ publishedAt: -1, _id: 1 })
      .limit(parseInt(limit) + 1);

    // Filter programs that have at least one published lesson
    const programsWithLessons = [];
    for (const program of programs) {
      const publishedLessonsCount = await program.getPublishedLessonsCount();
      if (publishedLessonsCount > 0) {
        programsWithLessons.push(program);
      }
    }

    // Check if there are more results
    const hasMore = programsWithLessons.length > limit;
    if (hasMore) programsWithLessons.pop();

    // Get assets for each program
    const programsWithAssets = await Promise.all(
      programsWithLessons.map(async (program) => {
        const assets = await ProgramAsset.find({ programId: program._id });
        return {
          id: program._id,
          title: program.title,
          description: program.description,
          language_primary: program.languagePrimary,
          languages_available: program.languagesAvailable,
          published_at: program.publishedAt,
          topics: program.topicIds.map(topic => topic.name),
          assets: {
            posters: assets.reduce((acc, asset) => {
              if (asset.assetType === 'poster') {
                if (!acc[asset.language]) acc[asset.language] = {};
                acc[asset.language][asset.variant] = asset.url;
              }
              return acc;
            }, {})
          }
        };
      })
    );

    const response = {
      programs: programsWithAssets,
      pagination: {
        cursor: hasMore ? programsWithLessons[programsWithLessons.length - 1]._id : null,
        hasMore
      }
    };

    // Cache the response
    if (redis) {
      try {
        await redis.setEx(cacheKey, 300, JSON.stringify(response));
      } catch (cacheError) {
        logger.warn('Cache write error:', cacheError);
      }
    }

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /catalog/programs/:id
 * Get published program with terms and published lessons
 */
const getProgram = async (req, res, next) => {
  try {
    const programId = req.params.id;
    const cacheKey = `catalog:program:${programId}`;
    const redis = getRedisClient();

    // Try to get from cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          setCacheHeaders(res, 300);
          return res.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        logger.warn('Cache read error:', cacheError);
      }
    }

    const program = await Program.findById(programId)
      .populate('topicIds', 'name');

    if (!program || program.status !== 'published') {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get terms with published lessons
    const terms = await Term.find({ programId: program._id }).sort({ termNumber: 1 });
    
    const termsWithLessons = await Promise.all(
      terms.map(async (term) => {
        const lessons = await Lesson.find({ 
          termId: term._id, 
          status: 'published' 
        }).sort({ lessonNumber: 1 });

        const lessonsWithAssets = await Promise.all(
          lessons.map(async (lesson) => {
            const assets = await LessonAsset.find({ lessonId: lesson._id });
            return {
              id: lesson._id,
              lesson_number: lesson.lessonNumber,
              title: lesson.title,
              content_type: lesson.contentType,
              duration_ms: lesson.durationMs,
              is_paid: lesson.isPaid,
              published_at: lesson.publishedAt,
              assets: {
                thumbnails: assets.reduce((acc, asset) => {
                  if (asset.assetType === 'thumbnail') {
                    if (!acc[asset.language]) acc[asset.language] = {};
                    acc[asset.language][asset.variant] = asset.url;
                  }
                  return acc;
                }, {})
              }
            };
          })
        );

        return {
          id: term._id,
          term_number: term.termNumber,
          title: term.title,
          lessons: lessonsWithAssets
        };
      })
    );

    // Get program assets
    const assets = await ProgramAsset.find({ programId: program._id });

    const response = {
      id: program._id,
      title: program.title,
      description: program.description,
      language_primary: program.languagePrimary,
      languages_available: program.languagesAvailable,
      published_at: program.publishedAt,
      topics: program.topicIds.map(topic => topic.name),
      assets: {
        posters: assets.reduce((acc, asset) => {
          if (asset.assetType === 'poster') {
            if (!acc[asset.language]) acc[asset.language] = {};
            acc[asset.language][asset.variant] = asset.url;
          }
          return acc;
        }, {})
      },
      terms: termsWithLessons
    };

    // Cache the response
    if (redis) {
      try {
        await redis.setEx(cacheKey, 300, JSON.stringify(response));
      } catch (cacheError) {
        logger.warn('Cache write error:', cacheError);
      }
    }

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /catalog/lessons/:id
 * Get published lesson details
 */
const getLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const cacheKey = `catalog:lesson:${lessonId}`;
    const redis = getRedisClient();

    // Try to get from cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          setCacheHeaders(res, 300);
          return res.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        logger.warn('Cache read error:', cacheError);
      }
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson || lesson.status !== 'published') {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get lesson assets
    const assets = await LessonAsset.find({ lessonId: lesson._id });

    const response = {
      id: lesson._id,
      title: lesson.title,
      content_type: lesson.contentType,
      duration_ms: lesson.durationMs,
      is_paid: lesson.isPaid,
      content_language_primary: lesson.contentLanguagePrimary,
      content_languages_available: lesson.contentLanguagesAvailable,
      content_urls_by_language: Object.fromEntries(lesson.contentUrlsByLanguage),
      subtitle_languages: lesson.subtitleLanguages,
      subtitle_urls_by_language: Object.fromEntries(lesson.subtitleUrlsByLanguage || new Map()),
      published_at: lesson.publishedAt,
      assets: {
        thumbnails: assets.reduce((acc, asset) => {
          if (asset.assetType === 'thumbnail') {
            if (!acc[asset.language]) acc[asset.language] = {};
            acc[asset.language][asset.variant] = asset.url;
          }
          return acc;
        }, {})
      }
    };

    // Cache the response
    if (redis) {
      try {
        await redis.setEx(cacheKey, 300, JSON.stringify(response));
      } catch (cacheError) {
        logger.warn('Cache write error:', cacheError);
      }
    }

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrograms,
  getProgram,
  getLesson
};