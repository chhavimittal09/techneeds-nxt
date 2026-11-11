const mongoose = require('mongoose');

const CohortSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, min: 1, max: 1000, default: 60 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

CohortSchema.index({ program: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
CohortSchema.index({ mentors: 1 });

module.exports = mongoose.model('Cohort', CohortSchema);
