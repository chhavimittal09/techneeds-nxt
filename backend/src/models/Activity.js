const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', index: true },
    kind: {
      type: String,
      enum: ['joined', 'video_started', 'video_completed', 'quiz_attempted', 'project_submitted', 'project_evaluated', 'badge_earned'],
      required: true
    },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    label: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

ActivitySchema.index({ user: 1, at: -1 });
ActivitySchema.index({ cohort: 1, at: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
