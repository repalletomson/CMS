/**
 * Lesson model for educational content
 */
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  termId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term',
    required: true
  },
  lessonNumber: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  contentType: {
    type: String,
    required: true,
    enum: ['video', 'article']
  },
  durationMs: {
    type: Number,
    min: 0,
    validate: {
      validator: function(duration) {
        return this.contentType !== 'video' || duration != null;
      },
      message: 'Duration is required for video content'
    }
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  contentLanguagePrimary: {
    type: String,
    required: true,
    maxlength: 10
  },
  contentLanguagesAvailable: {
    type: [String],
    required: true,
    validate: {
      validator: function(languages) {
        return languages.includes(this.contentLanguagePrimary);
      },
      message: 'Primary content language must be included in available languages'
    }
  },
  contentUrlsByLanguage: {
    type: Map,
    of: String,
    required: true,
    validate: {
      validator: function(urls) {
        return urls.has(this.contentLanguagePrimary);
      },
      message: 'Content URL for primary language is required'
    }
  },
  subtitleLanguages: {
    type: [String],
    default: []
  },
  subtitleUrlsByLanguage: {
    type: Map,
    of: String,
    default: new Map()
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'draft'
  },
  publishAt: {
    type: Date,
    validate: {
      validator: function(publishAt) {
        return this.status !== 'scheduled' || publishAt != null;
      },
      message: 'Publish date is required for scheduled lessons'
    }
  },
  publishedAt: {
    type: Date,
    validate: {
      validator: function(publishedAt) {
        return this.status !== 'published' || publishedAt != null;
      },
      message: 'Published date is required for published lessons'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Convert Map to Object for JSON serialization
      if (ret.contentUrlsByLanguage) {
        ret.contentUrlsByLanguage = Object.fromEntries(ret.contentUrlsByLanguage);
      }
      if (ret.subtitleUrlsByLanguage) {
        ret.subtitleUrlsByLanguage = Object.fromEntries(ret.subtitleUrlsByLanguage);
      }
      delete ret.__v;
      return ret;
    }
  }
});

// Compound unique index
lessonSchema.index({ termId: 1, lessonNumber: 1 }, { unique: true });
lessonSchema.index({ status: 1, publishAt: 1 });
lessonSchema.index({ status: 1, publishedAt: -1 });
lessonSchema.index({ termId: 1 });

/**
 * Validate required assets for primary content language
 * @returns {Promise<Object>}
 */
lessonSchema.methods.validateAssets = async function() {
  const LessonAsset = mongoose.model('LessonAsset');
  
  const requiredVariants = ['portrait', 'landscape'];
  const assets = await LessonAsset.find({
    lessonId: this._id,
    language: this.contentLanguagePrimary,
    assetType: 'thumbnail'
  });
  
  const availableVariants = assets.map(asset => asset.variant);
  const missingVariants = requiredVariants.filter(variant => 
    !availableVariants.includes(variant)
  );
  
  return {
    isValid: missingVariants.length === 0,
    missingVariants,
    message: missingVariants.length > 0 
      ? `Missing required thumbnail variants: ${missingVariants.join(', ')}`
      : 'All required assets are present'
  };
};

/**
 * Publish lesson and auto-publish parent program if needed
 * @returns {Promise<Object>}
 */
lessonSchema.methods.publish = async function() {
  // Validate assets before publishing
  const assetValidation = await this.validateAssets();
  if (!assetValidation.isValid) {
    throw new Error(`Cannot publish lesson: ${assetValidation.message}`);
  }
  
  // Update lesson status
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishAt = undefined; // Clear scheduled time
  
  await this.save();
  
  // Auto-publish parent program if it's still draft
  const Term = mongoose.model('Term');
  const Program = mongoose.model('Program');
  
  const term = await Term.findById(this.termId);
  if (term) {
    const program = await Program.findById(term.programId);
    if (program && program.status === 'draft') {
      await program.autoPublish();
    }
  }
  
  return this;
};

/**
 * Schedule lesson for future publication
 * @param {Date} publishAt - When to publish the lesson
 * @returns {Promise<Object>}
 */
lessonSchema.methods.schedule = async function(publishAt) {
  if (!publishAt || publishAt <= new Date()) {
    throw new Error('Publish date must be in the future');
  }
  
  this.status = 'scheduled';
  this.publishAt = publishAt;
  this.publishedAt = undefined;
  
  return this.save();
};

/**
 * Archive lesson
 * @returns {Promise<Object>}
 */
lessonSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Lesson', lessonSchema);