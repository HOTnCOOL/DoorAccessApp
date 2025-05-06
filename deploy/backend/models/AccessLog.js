const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema(
  {
    doorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Door',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null if user not identified
    },
    eventType: {
      type: String,
      enum: ['approach', 'access_attempt', 'access_granted', 'access_denied', 'double_verification'],
      required: true,
    },
    verificationMethod: {
      type: String,
      enum: ['code', 'face', 'double', 'none'],
      default: 'none',
    },
    success: {
      type: Boolean,
      default: false,
    },
    imagePath: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for faster querying
AccessLogSchema.index({ doorId: 1, createdAt: -1 });
AccessLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AccessLog', AccessLogSchema);