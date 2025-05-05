/**
 * Initialize Admin User
 * This script creates an admin user if none exists
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doorAccess';

// Admin user defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Initialize user schema for admin creation
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  accessCode: String,
  isActive: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', UserSchema);

async function initAdminUser() {
  console.log('Checking for existing admin user...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'administrator' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      // Create admin user
      const admin = new User({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'administrator',
        accessCode: hashedPassword,
        isActive: true,
        createdAt: new Date()
      });
      
      await admin.save();
      console.log(`Default admin user created with email: ${ADMIN_EMAIL}`);
      console.log('IMPORTANT: Please change the default password after first login!');
    } else {
      console.log('Admin user already exists. Skipping creation.');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Admin user check completed.');
  }
}

// Run the initialization
initAdminUser();