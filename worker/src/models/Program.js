/**
 * Program model for worker service
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
  }]
}, {
  timestamps: true
});

programSchema.index({ status: 1, languagePrimary: 1, publishedAt: -1 });
programSchema.index({ topicIds: 1 });
programSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Program', programSchema);