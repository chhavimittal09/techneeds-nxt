const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true },
    enrollmentNumber: { type: String, trim: true, uppercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'mentor', 'mentee'], required: true, index: true },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort' },
    interests: [{ type: String, trim: true, maxlength: 30 }],
    avatar: {
      style: { type: String, enum: ['orbit', 'prism', 'pixel', 'wave', 'grid'], default: 'orbit' },
      seed: { type: String, default: '' },
      accent: { type: String, default: '' }
    },
    share: {
      enabled: { type: Boolean, default: false },
      id: { type: String, index: true, sparse: true }
    },
    badges: [{ key: String, earnedAt: { type: Date, default: Date.now }, _id: false }],
    aiNarrative: {
      text: String,
      hash: String,
      model: String,
      generatedAt: Date
    },
    lastLoginAt: Date,
    lastActiveAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
UserSchema.index({ enrollmentNumber: 1 }, { unique: true, partialFilterExpression: { enrollmentNumber: { $type: 'string' } } });
UserSchema.index({ cohort: 1, role: 1 });

UserSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
