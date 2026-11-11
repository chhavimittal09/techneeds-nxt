const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  options: {
    type: [{ type: String, trim: true, maxlength: 200 }],
    validate: (v) => v.length >= 2 && v.length <= 6
  },
  correctIndex: { type: Number, required: true, min: 0 },
  marks: { type: Number, min: 0, default: 1 }
});

const ResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'quiz', 'project'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    instructions: { type: String, trim: true, maxlength: 5000, default: '' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    skills: [{ type: String, trim: true, maxlength: 40 }],
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, min: 0, default: 0 },
    published: { type: Boolean, default: false },
    publishedAt: Date,
    videoUrl: { type: String, trim: true },
    durationMinutes: { type: Number, min: 0 },
    submissionFormat: { type: String, trim: true, maxlength: 300 },
    timeLimitMinutes: { type: Number, min: 0 },
    questions: [QuestionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

ResourceSchema.index({ cohort: 1, published: 1, deadline: 1 });

module.exports = mongoose.model('Resource', ResourceSchema);
