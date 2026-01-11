/**
 * Topic model for categorizing programs
 */
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for performance
topicSchema.index({ name: 1 });
topicSchema.index({ isActive: 1 });

/**
 * Get programs count for this topic
 * @returns {Promise<number>}
 */
topicSchema.methods.getProgramsCount = async function() {
  const Program = mongoose.model('Program');
  return Program.countDocuments({ topicIds: this._id });
};

module.exports = mongoose.model('Topic', topicSchema);