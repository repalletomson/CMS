/**
 * Term model for worker service
 */
const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  termNumber: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    trim: true,
    maxlength: 255
  }
}, {
  timestamps: true
});

termSchema.index({ programId: 1, termNumber: 1 }, { unique: true });
termSchema.index({ programId: 1 });

module.exports = mongoose.model('Term', termSchema);