const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema(
  {
    marks: { type: Number, required: true, min: 0 },
    feedback: { type: String, trim: true, maxlength: 3000, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    link: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 4000, default: '' },
    submittedAt: { type: Date, default: Date.now },
    late: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'evaluated'], default: 'submitted' },
    marks: { type: Number },
    feedback: { type: String, default: '' },
    evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [EvaluationSchema]
  },
  { timestamps: true }
);

SubmissionSchema.index({ resource: 1, mentee: 1 }, { unique: true });
SubmissionSchema.index({ cohort: 1, status: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
