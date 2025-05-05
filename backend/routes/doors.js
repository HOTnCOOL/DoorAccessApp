const express = require('express');
const Door = require('../models/Door');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/doors
// @desc    Get all doors
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let doors;
    
    // Admins can see all doors
    if (req.user.role === 'administrator') {
      doors = await Door.find().sort('name');
    } else {
      // Other users can only see doors they have access to
      const user = await User.findById(req.user._id).select('doors');
      const doorIds = user.doors.map(door => door.doorId);
      doors = await Door.find({ _id: { $in: doorIds }, isActive: true }).sort('name');
    }
    
    res.json({ success: true, count: doors.length, data: doors });
  } catch (error) {
    console.error('Get doors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/doors/:id
// @desc    Get door by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const door = await Door.findById(req.params.id);
    
    if (!door) {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }

    // Check user has access to this door unless admin
    if (req.user.role !== 'administrator') {
      const hasAccess = await User.findOne({
        _id: req.user._id,
        'doors.doorId': door._id,
      });
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'No access to this door' });
      }
    }

    res.json({ success: true, data: door });
  } catch (error) {
    console.error('Get door error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/doors
// @desc    Create a new door
// @access  Private (Admin only)
router.post('/', authenticate, authorize(['administrator']), async (req, res) => {
  try {
    const { name, location, tasmotaIp, tasmotaApiKey, doubleVerificationDays } = req.body;

    // Validate input
    if (!name || !tasmotaIp) {
      return res.status(400).json({ success: false, message: 'Please provide name and Tasmota IP' });
    }

    // Create new door
    const newDoor = new Door({
      name,
      location,
      tasmotaIp,
      tasmotaApiKey: tasmotaApiKey || '',
      doubleVerificationDays: doubleVerificationDays || 0,
      createdBy: req.user._id,
    });

    await newDoor.save();

    res.status(201).json({
      success: true,
      data: newDoor,
    });
  } catch (error) {
    console.error('Create door error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/doors/:id
// @desc    Update a door
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize(['administrator']), async (req, res) => {
  try {
    const { name, location, tasmotaIp, tasmotaApiKey, doubleVerificationDays, isActive } = req.body;

    // Find door to update
    const door = await Door.findById(req.params.id);
    if (!door) {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }

    // Update fields
    if (name) door.name = name;
    if (location) door.location = location;
    if (tasmotaIp) door.tasmotaIp = tasmotaIp;
    if (tasmotaApiKey !== undefined) door.tasmotaApiKey = tasmotaApiKey;
    if (doubleVerificationDays !== undefined) door.doubleVerificationDays = doubleVerificationDays;
    if (isActive !== undefined) door.isActive = isActive;

    await door.save();

    res.json({
      success: true,
      data: door,
    });
  } catch (error) {
    console.error('Update door error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/doors/:id
// @desc    Delete a door
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize(['administrator']), async (req, res) => {
  try {
    const door = await Door.findById(req.params.id);
    if (!door) {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }

    await door.remove();
    
    // Also remove door from all users
    await User.updateMany(
      { 'doors.doorId': door._id },
      { $pull: { doors: { doorId: door._id } } }
    );
    
    res.json({ success: true, message: 'Door deleted' });
  } catch (error) {
    console.error('Delete door error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/doors/:id/access/:userId
// @desc    Grant door access to a user
// @access  Private (Admin, Host, Resident - depending on user role)
router.post('/:id/access/:userId', authenticate, async (req, res) => {
  try {
    const door = await Door.findById(req.params.id);
    if (!door) {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check authorization
    // 1. Admins can grant access to any door for any user
    if (req.user.role !== 'administrator') {
      // 2. Hosts and residents need access to the door themselves
      const hasAccess = await User.findOne({
        _id: req.user._id,
        'doors.doorId': door._id,
      });
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'You do not have access to this door' });
      }

      // 3. Check role-based permissions
      if (req.user.role === 'host' && !['resident', 'guest'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Hosts can only grant access to residents and guests' });
      }
      
      if (req.user.role === 'resident' && user.role !== 'guest') {
        return res.status(403).json({ success: false, message: 'Residents can only grant access to guests' });
      }
      
      if (req.user.role === 'guest') {
        return res.status(403).json({ success: false, message: 'Guests cannot grant door access' });
      }
    }

    // Check if user already has access to this door
    const alreadyHasAccess = user.doors.some(d => d.doorId.toString() === door._id.toString());
    if (alreadyHasAccess) {
      return res.status(400).json({ success: false, message: 'User already has access to this door' });
    }

    // Grant access
    user.doors.push({
      doorId: door._id,
      addedAt: new Date(),
    });

    await user.save();

    res.json({ success: true, message: 'Door access granted' });
  } catch (error) {
    console.error('Grant door access error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/doors/:id/access/:userId
// @desc    Revoke door access from a user
// @access  Private (Admin, or whoever granted the access)
router.delete('/:id/access/:userId', authenticate, async (req, res) => {
  try {
    const door = await Door.findById(req.params.id);
    if (!door) {
      return res.status(404).json({ success: false, message: 'Door not found' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check authorization
    if (req.user.role !== 'administrator' && req.user._id.toString() !== user.createdBy.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to revoke access' });
    }

    // Check if user has access to this door
    const doorIndex = user.doors.findIndex(d => d.doorId.toString() === door._id.toString());
    if (doorIndex === -1) {
      return res.status(400).json({ success: false, message: 'User does not have access to this door' });
    }

    // Revoke access
    user.doors.splice(doorIndex, 1);
    await user.save();

    res.json({ success: true, message: 'Door access revoked' });
  } catch (error) {
    console.error('Revoke door access error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;