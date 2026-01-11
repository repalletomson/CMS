/**
 * Asset controller for file upload and management
 */
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
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
 * POST /api/admin/programs/:id/assets
 * Upload program asset
 */
const uploadProgramAsset = async (req, res, next) => {
  try {
    const { id: programId } = req.params;
    const { language, variant, url } = req.body;

    if (!language || !variant || !url) {
      throw createError('Language, variant, and URL are required', 400, 'VALIDATION_ERROR');
    }

    // Check if asset already exists and update or create
    const existingAsset = await ProgramAsset.findOne({
      programId,
      language,
      variant,
      assetType: 'poster'
    });

    let asset;
    if (existingAsset) {
      existingAsset.url = url;
      asset = await existingAsset.save();
    } else {
      asset = new ProgramAsset({
        programId,
        language,
        variant,
        assetType: 'poster',
        url
      });
      await asset.save();
    }

    logger.info('Program asset uploaded', {
      assetId: asset._id,
      programId,
      language,
      variant,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(asset);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/programs/:id/assets/:assetId
 * Delete program asset
 */
const deleteProgramAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await ProgramAsset.findById(assetId);
    if (!asset) {
      throw createError('Asset not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await ProgramAsset.findByIdAndDelete(assetId);

    logger.info('Program asset deleted', {
      assetId: asset._id,
      programId: asset.programId,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/assets
 * Upload lesson asset
 */
const uploadLessonAsset = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { language, variant, url } = req.body;

    if (!language || !variant || !url) {
      throw createError('Language, variant, and URL are required', 400, 'VALIDATION_ERROR');
    }

    // Check if asset already exists and update or create
    const existingAsset = await LessonAsset.findOne({
      lessonId,
      language,
      variant,
      assetType: 'thumbnail'
    });

    let asset;
    if (existingAsset) {
      existingAsset.url = url;
      asset = await existingAsset.save();
    } else {
      asset = new LessonAsset({
        lessonId,
        language,
        variant,
        assetType: 'thumbnail',
        url
      });
      await asset.save();
    }

    logger.info('Lesson asset uploaded', {
      assetId: asset._id,
      lessonId,
      language,
      variant,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(asset);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/lessons/:id/assets/:assetId
 * Delete lesson asset
 */
const deleteLessonAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await LessonAsset.findById(assetId);
    if (!asset) {
      throw createError('Asset not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await LessonAsset.findByIdAndDelete(assetId);

    logger.info('Lesson asset deleted', {
      assetId: asset._id,
      lessonId: asset.lessonId,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProgramAsset,
  deleteProgramAsset,
  uploadLessonAsset,
  deleteLessonAsset
};