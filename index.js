const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const server = express();
const adminRouter = require('./routes/admin');
const centerRouter = require('./routes/center');
const memberRouter = require('./routes/member');
const cors = require('cors');
const fs = require('fs');

// Function to get the correct .env file path
function getEnvPath() {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '.env');
  }
  // In production (packaged app)
  return path.join(process.resourcesPath, '.env');
}

// Function to get the correct images directory path
function getImagesPath() {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'images');
  }
  // In production (packaged app)
  return path.join(process.resourcesPath, 'images');
}

// Create images directory if it doesn't exist
const imagesPath = getImagesPath();
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath, { recursive: true });
  console.log('Created images directory at:', imagesPath);
}

// Load environment variables
const envPath = getEnvPath();
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Environment variables loaded successfully');
} else {
  console.error('.env file not found at:', envPath);
}

// Log MongoDB URL (without password)
const mongoUrl = process.env.MONGO_URL;
const safeMongoUrl = mongoUrl ? mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//****:****@') : 'not set';
console.log('Attempting to connect to MongoDB Atlas with URL:', safeMongoUrl);

// MongoDB Connection Options for Atlas
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority'
};

// Connect to MongoDB Atlas with retry logic
const connectWithRetry = async () => {
  console.log('Attempting to connect to MongoDB Atlas...');
  console.log('Current connection state:', mongoose.connection.readyState);
  
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB Atlas');
      return;
    }

    if (mongoose.connection.readyState === 2) {
      console.log('Already connecting to MongoDB Atlas');
      return;
    }

    await mongoose.connect(process.env.MONGO_URL, mongoOptions);
    console.log('MongoDB Atlas connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err.message);
    console.error('Full error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB Atlas is connected');
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Atlas connection error:', err);
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Atlas is disconnected');
  console.log('Connection state:', mongoose.connection.readyState);
  // Attempt to reconnect
  setTimeout(connectWithRetry, 5000);
});

// CORS configuration
server.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
server.use(express.json());
server.use(express.static(path.resolve(__dirname, 'build')));
server.use('/images', express.static(imagesPath));

// API Routes with connection check middleware
const checkMongoConnection = (req, res, next) => {
  console.log('Checking MongoDB connection state:', mongoose.connection.readyState);
  if (mongoose.connection.readyState !== 1) {
    console.log('Database not ready, current state:', mongoose.connection.readyState);
    return res.status(503).json({
      success: false,
      message: 'Database connection not ready. Please try again in a few moments.',
      connectionState: mongoose.connection.readyState
    });
  }
  next();
};

server.use('/api/admin', checkMongoConnection, adminRouter.router);
server.use('/api/centers', checkMongoConnection, centerRouter.router);
server.use('/api/members', checkMongoConnection, memberRouter.router);

// Serve the React app
server.use('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

// Error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}...`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB Atlas connection closed through app termination');
    process.exit(0);
  });
});

// Export the server instance for Electron
module.exports = serverInstance;