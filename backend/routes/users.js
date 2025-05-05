const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, generateToken } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/users/login
// @desc    Login user with access code
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, accessCode } = req.body;

    // Validate input
    if (!email || !accessCode) {
      return res.status(400).json({ success: false, message: 'Please provide email and access code' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // Check if access code is correct
    const isMatch = await user.compareAccessCode(accessCode);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user access is expired
    if (user.isAccessExpired()) {
      return res.status(401).json({ success: false, message: 'Your access has expired' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin, Host)
router.get('/', authenticate, authorize(['administrator', 'host']), async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show users created by this user
    if (req.user.role !== 'administrator') {
      query.createdBy = req.user._id;
    }
    
    const users = await User.find(query)
      .select('-accessCode -faceData')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-accessCode -faceData')
      .populate('createdBy', 'name email');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only allow if admin, the user themselves, or the creator of this user
    if (
      req.user.role !== 'administrator' &&
      req.user._id.toString() !== user._id.toString() &&
      (user.createdBy && req.user._id.toString() !== user.createdBy.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (depends on role)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phone, role, accessCode, doors, accessPeriods, expirationDate } = req.body;

    // Validate input
    if (!name || !email || !accessCode) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and access code' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Role-based authorization checks
    const requestedRole = role || 'guest';
    
    // Check if user is allowed to create this role
    if (!canCreateRole(req.user.role, requestedRole)) {
      return res.status(403).json({ success: false, message: `You cannot create ${requestedRole} accounts` });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      role: requestedRole,
      accessCode,
      doors: doors || [],
      accessPeriods: accessPeriods || [],
      expirationDate: expirationDate || null,
      createdBy: req.user._id,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private (depends on role)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email, phone, role, accessCode, doors, accessPeriods, expirationDate, isActive } = req.body;

    // Find user to update
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization check
    if (!canModifyUser(req.user, user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this user' });
    }

    // Role update authorization check
    if (role && role !== user.role && !canChangeUserRole(req.user.role, user.role, role)) {
      return res.status(403).json({ success: false, message: `You cannot change a user's role to ${role}` });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (accessCode) user.accessCode = accessCode;
    if (doors) user.doors = doors;
    if (accessPeriods) user.accessPeriods = accessPeriods;
    if (expirationDate !== undefined) user.expirationDate = expirationDate;
    if (isActive !== undefined && req.user.role === 'administrator') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize(['administrator']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.remove();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions for role-based authorization

/**
 * Check if a user with given role can create a user with target role
 * @param {string} userRole - Role of the user creating
 * @param {string} targetRole - Role to be created
 * @returns {boolean} Whether creation is allowed
 */
function canCreateRole(userRole, targetRole) {
  // Role hierarchy
  const roleHierarchy = {
    administrator: ['administrator', 'host', 'resident', 'guest'],
    host: ['resident', 'guest'],
    resident: ['guest'],
    guest: [],
  };

  return roleHierarchy[userRole].includes(targetRole);
}

/**
 * Check if a user can modify another user
 * @param {Object} modifier - User doing the modification
 * @param {Object} target - User being modified
 * @returns {boolean} Whether modification is allowed
 */
function canModifyUser(modifier, target) {
  // Admins can modify anyone
  if (modifier.role === 'administrator') return true;

  // Users can modify themselves
  if (modifier._id.toString() === target._id.toString()) return true;

  // Users can modify users they created
  if (target.createdBy && modifier._id.toString() === target.createdBy.toString()) return true;

  return false;
}

/**
 * Check if a user can change another user's role
 * @param {string} modifierRole - Role of user doing the change
 * @param {string} currentRole - Current role of target user
 * @param {string} newRole - New role for target user
 * @returns {boolean} Whether role change is allowed
 */
function canChangeUserRole(modifierRole, currentRole, newRole) {
  // Only admins can change roles
  if (modifierRole !== 'administrator') return false;

  // Admins can change any role
  return true;
}

module.exports = router;