const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['administrator', 'host', 'resident', 'guest'],
      default: 'guest',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    accessCode: {
      type: String,
      required: true,
    },
    faceData: {
      type: Object,
      default: null,
    },
    doors: [
      {
        doorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Door',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    accessPeriods: [
      {
        start: Date,
        end: Date,
      },
    ],
    expirationDate: {
      type: Date,
      default: null,
    },
    lastVerification: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('accessCode')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.accessCode = await bcrypt.hash(this.accessCode, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.compareAccessCode = async function (accessCode) {
  return await bcrypt.compare(accessCode, this.accessCode);
};

// Check if user has access to a specific door
UserSchema.methods.hasAccessToDoor = function (doorId) {
  return this.doors.some((door) => door.doorId.toString() === doorId.toString());
};

// Check if user access is expired
UserSchema.methods.isAccessExpired = function () {
  if (!this.expirationDate) return false;
  return new Date() > this.expirationDate;
};

// Check if user should perform double verification
UserSchema.methods.shouldPerformDoubleVerification = function (doubleVerificationDays) {
  if (doubleVerificationDays <= 0) return false;
  if (!this.lastVerification) return true;
  
  const lastVerificationDate = new Date(this.lastVerification);
  const daysSinceLastVerification = (Date.now() - lastVerificationDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceLastVerification >= doubleVerificationDays;
};

module.exports = mongoose.model('User', UserSchema);