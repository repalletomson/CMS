/**
 * Program controller for CRUD operations
 */
const Program = require('../models/Program');
const Topic = require('../models/Topic');
const ProgramAsset = require('../models/ProgramAsset');
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
 * GET /api/admin/programs
 * Get programs with filtering and pagination
 */
const getPrograms = async (req, res, next) => {
  try {
    const {
      status,
      language,
      topic,
      cursor,
      limit = 20,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (language) filter.languagePrimary = language;
    if (search) {
      filter.$text = { $search: search };
    }
    
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

    const programs = await Program.find(filter)
      .populate('topicIds', 'name')
      .sort({ _id: 1 })
      .limit(parseInt(limit) + 1);

    // Check if there are more results
    const hasMore = programs.length > limit;
    if (hasMore) programs.pop();

    // Get assets for each program
    const programsWithAssets = await Promise.all(
      programs.map(async (program) => {
        const assets = await ProgramAsset.find({ programId: program._id });
        return {
          ...program.toJSON(),
          assets: assets.reduce((acc, asset) => {
            if (!acc[asset.assetType]) acc[asset.assetType] = {};
            if (!acc[asset.assetType][asset.language]) acc[asset.assetType][asset.language] = {};
            acc[asset.assetType][asset.language][asset.variant] = asset.url;
            return acc;
          }, {})
        };
      })
    );

    res.json({
      programs: programsWithAssets,
      pagination: {
        cursor: hasMore ? programs[programs.length - 1]._id : null,
        hasMore
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs
 * Create new program
 */
const createProgram = async (req, res, next) => {
  try {
    const {
      title,
      description,
      youtubeUrl,
      thumbnail,
      customThumbnail,
      difficulty,
      duration,
      price,
      tags,
      languagePrimary,
      languagesAvailable,
      topicIds
    } = req.body;

    // Validate required fields
    if (!title || !languagePrimary || !languagesAvailable) {
      throw createError('Title, primary language, and available languages are required', 400, 'VALIDATION_ERROR');
    }

    // Extract YouTube video ID if URL provided
    let youtubeVideoId = null;
    if (youtubeUrl) {
      const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      youtubeVideoId = match ? match[1] : null;
    }

    // Set thumbnail URL
    let thumbnailUrl = thumbnail;
    if (!thumbnailUrl) {
      if (youtubeVideoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
      } else {
        // Default Unsplash educational image
        const query = encodeURIComponent(title || 'education');
        thumbnailUrl = `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80&txt=${query}`;
      }
    }

    const program = new Program({
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      thumbnail: thumbnailUrl,
      customThumbnail: customThumbnail || false,
      difficulty: difficulty || 'beginner',
      duration: duration || 0,
      price: price || 0,
      tags: tags || [],
      languagePrimary,
      languagesAvailable,
      topicIds: topicIds || [],
      status: 'draft'
    });

    await program.save();

    logger.info('Program created', {
      programId: program._id,
      title: program.title,
      youtubeVideoId,
      customThumbnail
    });

    // Populate topics for response
    await program.populate('topicIds');

    res.status(201).json({
      message: 'Program created successfully',
      program
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/programs/:id
 * Get program by ID
 */
const getProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('topicIds', 'name');

    if (!program) {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get assets
    const assets = await ProgramAsset.find({ programId: program._id });
    const programWithAssets = {
      ...program.toJSON(),
      assets: assets.reduce((acc, asset) => {
        if (!acc[asset.assetType]) acc[asset.assetType] = {};
        if (!acc[asset.assetType][asset.language]) acc[asset.assetType][asset.language] = {};
        acc[asset.assetType][asset.language][asset.variant] = asset.url;
        return acc;
      }, {})
    };

    res.json(programWithAssets);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/programs/:id
 * Update program
 */
const updateProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const {
      title,
      description,
      languagePrimary,
      languagesAvailable,
      topicIds,
      status
    } = req.body;

    // Validate topics exist
    if (topicIds && topicIds.length > 0) {
      const topics = await Topic.find({ _id: { $in: topicIds } });
      if (topics.length !== topicIds.length) {
        throw createError('One or more topics not found', 400, 'VALIDATION_ERROR');
      }
    }

    // Update fields
    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    if (languagePrimary !== undefined) program.languagePrimary = languagePrimary;
    if (languagesAvailable !== undefined) program.languagesAvailable = languagesAvailable;
    if (topicIds !== undefined) program.topicIds = topicIds;
    if (status !== undefined) program.status = status;

    await program.save();
    await program.populate('topicIds', 'name');

    logger.info('Program updated', {
      programId: program._id,
      title: program.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(program);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/programs/:id
 * Delete program
 */
const deleteProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Delete associated assets
    await ProgramAsset.deleteMany({ programId: program._id });

    // Delete the program (cascade delete will handle terms and lessons)
    await Program.findByIdAndDelete(req.params.id);

    logger.info('Program deleted', {
      programId: program._id,
      title: program.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrograms,
  createProgram,
  getProgram,
  updateProgram,
  deleteProgram
};