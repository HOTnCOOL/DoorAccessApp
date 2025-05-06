const mongoose = require('mongoose');

const DoorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    tasmotaIp: {
      type: String,
      required: true,
    },
    tasmotaApiKey: {
      type: String,
      default: '',
    },
    doubleVerificationDays: {
      type: Number,
      default: 0, // 0 means disabled
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Door', DoorSchema);