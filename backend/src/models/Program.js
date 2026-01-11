/**
 * Program model for educational programs
 */
const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 2000
  },
  // YouTube video integration
  youtubeUrl: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  youtubeVideoId: {
    type: String // Extracted from YouTube URL
  },
  // Image handling
  thumbnail: {
    type: String, // URL to thumbnail image
    default: function() {
      // Default Unsplash image for education
      return `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80`;
    }
  },
  customThumbnail: {
    type: Boolean,
    default: false // Track if user uploaded custom thumbnail
  },
  languagePrimary: {
    type: String,
    required: true,
    maxlength: 10
  },
  languagesAvailable: {
    type: [String],
    required: true,
    validate: {
      validator: function(languages) {
        return languages.includes(this.languagePrimary);
      },
      message: 'Primary language must be included in available languages'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  // Additional metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number, // Duration in minutes
    min: 0
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
programSchema.index({ status: 1, languagePrimary: 1, publishedAt: -1 });
programSchema.index({ topicIds: 1 });
programSchema.index({ createdAt: -1 });
programSchema.index({ title: 'text', description: 'text' });

/**
 * Extract YouTube video ID from URL and save it
 */
programSchema.pre('save', function(next) {
  if (this.youtubeUrl && this.isModified('youtubeUrl')) {
    const match = this.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      this.youtubeVideoId = match[1];
    }
  }
  next();
});

/**
 * Auto-publish program when first lesson is published
 */
programSchema.methods.autoPublish = async function() {
  if (this.status === 'draft') {
    this.status = 'published';
    this.publishedAt = this.publishedAt || new Date();
    return this.save();
  }
  return this;
};

/**
 * Get terms count for this program
 * @returns {Promise<number>}
 */
programSchema.methods.getTermsCount = async function() {
  const Term = mongoose.model('Term');
  return Term.countDocuments({ programId: this._id });
};

/**
 * Get published lessons count for this program
 * @returns {Promise<number>}
 */
programSchema.methods.getPublishedLessonsCount = async function() {
  const Term = mongoose.model('Term');
  const Lesson = mongoose.model('Lesson');
  
  const terms = await Term.find({ programId: this._id }).select('_id');
  const termIds = terms.map(term => term._id);
  
  return Lesson.countDocuments({ 
    termId: { $in: termIds }, 
    status: 'published' 
  });
};

/**
 * Validate required assets for primary language
 * @returns {Promise<Object>}
 */
programSchema.methods.validateAssets = async function() {
  const ProgramAsset = mongoose.model('ProgramAsset');
  
  const requiredVariants = ['portrait', 'landscape'];
  const assets = await ProgramAsset.find({
    programId: this._id,
    language: this.languagePrimary,
    assetType: 'poster'
  });
  
  const availableVariants = assets.map(asset => asset.variant);
  const missingVariants = requiredVariants.filter(variant => 
    !availableVariants.includes(variant)
  );
  
  return {
    isValid: missingVariants.length === 0,
    missingVariants,
    message: missingVariants.length > 0 
      ? `Missing required poster variants: ${missingVariants.join(', ')}`
      : 'All required assets are present'
  };
};

module.exports = mongoose.model('Program', programSchema);