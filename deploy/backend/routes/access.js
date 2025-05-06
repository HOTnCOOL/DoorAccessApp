const express = require('express');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Door = require('../models/Door');
const AccessLog = require('../models/AccessLog');
const { unlockDoor, lockDoor, toggleDoorLock } = require('../utils/tasmota');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @route   POST /api/access/code
// @desc    Verify access code
// @access  Public
router.post('/code', async (req, res) => {
  try {
    const { doorId, accessCode } = req.body;

    if (!doorId || !accessCode) {
      return res.status(400).json({ success: false, message: 'Door ID and access code are required' });
    }

    // Find door
    const door = await Door.findById(doorId);
    if (!door || !door.isActive) {
      return res.status(404).json({ success: false, message: 'Door not found or inactive' });
    }

    // Find all users with access to this door
    const users = await User.find({
      'doors.doorId': doorId,
      isActive: true,
    });

    // Check access code against all users
    let authorizedUser = null;
    for (const user of users) {
      const isMatch = await user.compareAccessCode(accessCode);
      if (isMatch) {
        authorizedUser = user;
        break;
      }
    }

    if (!authorizedUser) {
      // Log failed attempt
      await AccessLog.create({
        doorId,
        eventType: 'access_attempt',
        verificationMethod: 'code',
        success: false,
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Invalid access code' });
    }

    // Check if access is expired
    if (authorizedUser.isAccessExpired()) {
      await AccessLog.create({
        doorId,
        userId: authorizedUser._id,
        eventType: 'access_attempt',
        verificationMethod: 'code',
        success: false,
        metadata: { reason: 'expired' },
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Your access has expired' });
    }

    // Check if double verification is required
    const requireDoubleVerification = authorizedUser.shouldPerformDoubleVerification(door.doubleVerificationDays);

    // Create log entry
    await AccessLog.create({
      doorId,
      userId: authorizedUser._id,
      eventType: requireDoubleVerification ? 'double_verification' : 'access_granted',
      verificationMethod: 'code',
      success: true,
      ipAddress: req.ip,
    });

    if (requireDoubleVerification) {
      return res.json({
        success: true,
        doubleVerificationRequired: true,
        message: 'Double verification required. Please also provide face recognition.',
        user: {
          name: authorizedUser.name,
          role: authorizedUser.role,
        },
      });
    }

    // Toggle door lock
    const switchResult = await toggleDoorLock(door);

    // Update last verification time
    authorizedUser.lastVerification = new Date();
    await authorizedUser.save();

    res.json({
      success: true,
      message: 'Access granted',
      user: {
        name: authorizedUser.name,
        role: authorizedUser.role,
      },
      doorStatus: switchResult,
    });
  } catch (error) {
    console.error('Access code verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/access/face
// @desc    Verify face
// @access  Public
router.post('/face', async (req, res) => {
  try {
    const { doorId, faceData, imagePath } = req.body;

    if (!doorId || !faceData) {
      return res.status(400).json({ success: false, message: 'Door ID and face data are required' });
    }

    // Find door
    const door = await Door.findById(doorId);
    if (!door || !door.isActive) {
      return res.status(404).json({ success: false, message: 'Door not found or inactive' });
    }

    // Find user with matching face data and door access
    // Note: This is a simplified placeholder - in a real application,
    // you'd use a proper face recognition service to compare faceData
    const users = await User.find({
      'doors.doorId': doorId,
      isActive: true,
      faceData: { $ne: null },
    });

    // Find matching user (simplified)
    // In a real app, you'd compare face embeddings with a threshold
    let authorizedUser = null;
    for (const user of users) {
      // Pretend we're doing face comparison here
      // This is just a placeholder - real implementation would use a face recognition API
      if (user.faceData) {
        authorizedUser = user;
        break;
      }
    }

    // Save the image if provided
    let savedImagePath = null;
    if (imagePath) {
      // In a real app, you'd save the image in a more secure way
      // This is just a placeholder
      savedImagePath = path.join('uploads', `face_${Date.now()}.jpg`);
    }

    if (!authorizedUser) {
      // Log failed attempt
      await AccessLog.create({
        doorId,
        eventType: 'access_attempt',
        verificationMethod: 'face',
        success: false,
        imagePath: savedImagePath,
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Face not recognized' });
    }

    // Check if access is expired
    if (authorizedUser.isAccessExpired()) {
      await AccessLog.create({
        doorId,
        userId: authorizedUser._id,
        eventType: 'access_attempt',
        verificationMethod: 'face',
        success: false,
        imagePath: savedImagePath,
        metadata: { reason: 'expired' },
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Your access has expired' });
    }

    // Check if double verification is required
    const requireDoubleVerification = authorizedUser.shouldPerformDoubleVerification(door.doubleVerificationDays);

    // Create log entry
    await AccessLog.create({
      doorId,
      userId: authorizedUser._id,
      eventType: requireDoubleVerification ? 'double_verification' : 'access_granted',
      verificationMethod: 'face',
      success: true,
      imagePath: savedImagePath,
      ipAddress: req.ip,
    });

    if (requireDoubleVerification) {
      return res.json({
        success: true,
        doubleVerificationRequired: true,
        message: 'Double verification required. Please also provide access code.',
        user: {
          name: authorizedUser.name,
          role: authorizedUser.role,
        },
      });
    }

    // Toggle door lock
    const switchResult = await toggleDoorLock(door);

    // Update last verification time
    authorizedUser.lastVerification = new Date();
    await authorizedUser.save();

    res.json({
      success: true,
      message: 'Access granted',
      user: {
        name: authorizedUser.name,
        role: authorizedUser.role,
      },
      doorStatus: switchResult,
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/access/motion
// @desc    Process motion detection
// @access  Public
router.post('/motion', async (req, res) => {
  try {
    const { doorId, imagePath } = req.body;

    if (!doorId) {
      return res.status(400).json({ success: false, message: 'Door ID is required' });
    }

    // Find door
    const door = await Door.findById(doorId);
    if (!door || !door.isActive) {
      return res.status(404).json({ success: false, message: 'Door not found or inactive' });
    }

    // Save the image if provided
    let savedImagePath = null;
    if (imagePath) {
      // In a real app, you'd save the image in a more secure way
      savedImagePath = path.join('uploads', `motion_${Date.now()}.jpg`);
    }

    // Log motion event
    await AccessLog.create({
      doorId,
      eventType: 'approach',
      verificationMethod: 'none',
      success: true,
      imagePath: savedImagePath,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Motion detected and logged',
    });
  } catch (error) {
    console.error('Motion detection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/access/double-verify
// @desc    Process double verification
// @access  Public
router.post('/double-verify', async (req, res) => {
  try {
    const { doorId, userId, accessCode, faceData } = req.body;

    if (!doorId || !userId || (!accessCode && !faceData)) {
      return res.status(400).json({
        success: false,
        message: 'Door ID, user ID, and either access code or face data are required',
      });
    }

    // Find door
    const door = await Door.findById(doorId);
    if (!door || !door.isActive) {
      return res.status(404).json({ success: false, message: 'Door not found or inactive' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found or inactive' });
    }

    // Check if user has access to door
    if (!user.hasAccessToDoor(doorId)) {
      return res.status(403).json({ success: false, message: 'User does not have access to this door' });
    }

    // Check if access is expired
    if (user.isAccessExpired()) {
      await AccessLog.create({
        doorId,
        userId: user._id,
        eventType: 'access_attempt',
        verificationMethod: 'double',
        success: false,
        metadata: { reason: 'expired' },
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Your access has expired' });
    }

    // Verify credentials
    let isVerified = false;

    if (accessCode) {
      isVerified = await user.compareAccessCode(accessCode);
    } else if (faceData) {
      // Simplified face verification
      // In a real app, you'd compare face embeddings with a threshold
      isVerified = user.faceData !== null;
    }

    if (!isVerified) {
      await AccessLog.create({
        doorId,
        userId: user._id,
        eventType: 'access_attempt',
        verificationMethod: 'double',
        success: false,
        ipAddress: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Verification failed' });
    }

    // Toggle door lock
    const switchResult = await toggleDoorLock(door);

    // Update last verification time
    user.lastVerification = new Date();
    await user.save();

    // Create log entry
    await AccessLog.create({
      doorId,
      userId: user._id,
      eventType: 'access_granted',
      verificationMethod: 'double',
      success: true,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Access granted',
      user: {
        name: user.name,
        role: user.role,
      },
      doorStatus: switchResult,
    });
  } catch (error) {
    console.error('Double verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/access/logs
// @desc    Get access logs
// @access  Private (Admin, Host)
router.get('/logs', authenticate, authorize(['administrator', 'host']), async (req, res) => {
  try {
    const { doorId, userId, eventType, startDate, endDate, limit = 50, page = 1 } = req.query;

    const query = {};

    // Filter by door if specified
    if (doorId) {
      query.doorId = doorId;
    } else if (req.user.role !== 'administrator') {
      // Non-admins can only see logs for doors they have access to
      const user = await User.findById(req.user._id).select('doors');
      const doorIds = user.doors.map(door => door.doorId);
      query.doorId = { $in: doorIds };
    }

    // Filter by user if specified
    if (userId) {
      query.userId = userId;
    }

    // Filter by event type if specified
    if (eventType) {
      query.eventType = eventType;
    }

    // Filter by date range if specified
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get logs with pagination
    const logs = await AccessLog.find(query)
      .populate('doorId', 'name location')
      .populate('userId', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLogs = await AccessLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
      data: logs,
    });
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/access/logs/:id/image
// @desc    Get access log image
// @access  Private (Admin, Host)
router.get('/logs/:id/image', authenticate, authorize(['administrator', 'host']), async (req, res) => {
  try {
    const log = await AccessLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    
    if (!log.imagePath) {
      return res.status(404).json({ success: false, message: 'No image available for this log' });
    }
    
    // Check authorization for non-admins
    if (req.user.role !== 'administrator') {
      const user = await User.findById(req.user._id).select('doors');
      const doorIds = user.doors.map(door => door.doorId.toString());
      
      if (!doorIds.includes(log.doorId.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this log' });
      }
    }
    
    // Send the image file
    const imagePath = path.join(__dirname, '..', log.imagePath);
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Get log image error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;