const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for camera access

// Serve static files for captured images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const userRoutes = require('./routes/users');
const doorRoutes = require('./routes/doors');
const accessRoutes = require('./routes/access');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Door Access API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/doors', doorRoutes);
app.use('/api/access', accessRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect to MongoDB
const PORT = process.env.PORT || 8001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doorAccess';

console.log(`Connecting to MongoDB: ${MONGO_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);

const connectWithRetry = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
      return true;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, err.message);
      console.log(`Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  return false;
};

// Start the server
const startServer = async () => {
  const connected = await connectWithRetry();
  
  if (connected) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } else {
    console.error('Server could not start due to database connection failure');
    process.exit(1);
  }
};

startServer();