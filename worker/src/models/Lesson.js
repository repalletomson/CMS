/**
 * Lesson model for worker service
 * (Copy of backend/src/models/Lesson.js)
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
  timestamps: true
});

// Indexes
lessonSchema.index({ termId: 1, lessonNumber: 1 }, { unique: true });
lessonSchema.index({ status: 1, publishAt: 1 });
lessonSchema.index({ status: 1, publishedAt: -1 });
lessonSchema.index({ termId: 1 });

/**
 * Validate required assets for primary content language
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

module.exports = mongoose.model('Lesson', lessonSchema);