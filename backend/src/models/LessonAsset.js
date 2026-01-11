/**
 * Lesson Asset model for lesson thumbnails and media
 */
const mongoose = require('mongoose');

const lessonAssetSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  language: {
    type: String,
    required: true,
    maxlength: 10
  },
  variant: {
    type: String,
    required: true,
    enum: ['portrait', 'landscape', 'square', 'banner']
  },
  assetType: {
    type: String,
    required: true,
    enum: ['thumbnail']
  },
  url: {
    type: String,
    required: true,
    maxlength: 500
  },
  filename: {
    type: String,
    maxlength: 255
  },
  mimeType: {
    type: String,
    maxlength: 100
  },
  fileSize: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound unique index to prevent duplicates
lessonAssetSchema.index({ 
  lessonId: 1, 
  language: 1, 
  variant: 1, 
  assetType: 1 
}, { unique: true });

lessonAssetSchema.index({ lessonId: 1 });

module.exports = mongoose.model('LessonAsset', lessonAssetSchema);