const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    marks: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ProgressSchema.index({ resource: 1, mentee: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
