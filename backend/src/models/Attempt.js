const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    answers: [{ questionId: String, selectedIndex: Number, _id: false }],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    late: { type: Boolean, default: false }
  },
  { timestamps: true }
);

AttemptSchema.index({ resource: 1, mentee: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', AttemptSchema);
