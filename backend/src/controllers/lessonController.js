/**
 * Lesson controller for CRUD operations
 */
const Lesson = require('../models/Lesson');
const Term = require('../models/Term');
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
 * GET /api/admin/terms/:termId/lessons
 * Get lessons for a term
 */
const getLessons = async (req, res, next) => {
  try {
    const { termId } = req.params;

    // Verify term exists
    const term = await Term.findById(termId);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const lessons = await Lesson.find({ termId }).sort({ lessonNumber: 1 });
    res.json({ lessons });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/terms/:termId/lessons
 * Create new lesson
 */
const createLesson = async (req, res, next) => {
  try {
    const { termId } = req.params;
    const {
      lessonNumber,
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage
    } = req.body;

    // Verify term exists
    const term = await Term.findById(termId);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const lesson = new Lesson({
      termId,
      lessonNumber,
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage: new Map(Object.entries(contentUrlsByLanguage || {})),
      subtitleLanguages,
      subtitleUrlsByLanguage: new Map(Object.entries(subtitleUrlsByLanguage || {}))
    });

    await lesson.save();

    logger.info('Lesson created', {
      lessonId: lesson._id,
      termId,
      title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/lessons/:id
 * Get lesson by ID
 */
const getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/lessons/:id
 * Update lesson
 */
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const {
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage
    } = req.body;

    // Update fields
    if (title !== undefined) lesson.title = title;
    if (contentType !== undefined) lesson.contentType = contentType;
    if (durationMs !== undefined) lesson.durationMs = durationMs;
    if (isPaid !== undefined) lesson.isPaid = isPaid;
    if (contentLanguagePrimary !== undefined) lesson.contentLanguagePrimary = contentLanguagePrimary;
    if (contentLanguagesAvailable !== undefined) lesson.contentLanguagesAvailable = contentLanguagesAvailable;
    if (contentUrlsByLanguage !== undefined) {
      lesson.contentUrlsByLanguage = new Map(Object.entries(contentUrlsByLanguage));
    }
    if (subtitleLanguages !== undefined) lesson.subtitleLanguages = subtitleLanguages;
    if (subtitleUrlsByLanguage !== undefined) {
      lesson.subtitleUrlsByLanguage = new Map(Object.entries(subtitleUrlsByLanguage));
    }

    await lesson.save();

    logger.info('Lesson updated', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/lessons/:id
 * Delete lesson
 */
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await Lesson.findByIdAndDelete(req.params.id);

    logger.info('Lesson deleted', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/publish
 * Publish lesson immediately
 */
const publishLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await lesson.publish();

    logger.info('Lesson published', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/schedule
 * Schedule lesson for future publication
 */
const scheduleLesson = async (req, res, next) => {
  try {
    const { publishAt } = req.body;

    if (!publishAt) {
      throw createError('Publish date is required', 400, 'VALIDATION_ERROR');
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await lesson.schedule(new Date(publishAt));

    logger.info('Lesson scheduled', {
      lessonId: lesson._id,
      title: lesson.title,
      publishAt,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/archive
 * Archive lesson
 */
const archiveLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await lesson.archive();

    logger.info('Lesson archived', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLessons,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  scheduleLesson,
  archiveLesson
};