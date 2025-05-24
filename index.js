const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const adminRouter = require('./routes/admin');
const centerRouter = require('./routes/center');
const memberRouter = require('./routes/member');

const server = express();

// === Step 1: Load .env from default location first ===
const defaultEnvPath = path.join(__dirname, '.env');
require('dotenv').config({ path: defaultEnvPath });
console.log('Initial NODE_ENV:', process.env.NODE_ENV);

// === Step 2: Now safely use NODE_ENV to determine paths ===
function getEnvPath() {
  if (process.env.NODE_ENV === 'development') {
    console.log("ANILKMAR HEHEEEE");
    return path.join(__dirname, '.env');
  }
  console.log("ANILKMAR THEHEEEEE");
  return path.join(process.resourcesPath, '.env');
}

function getImagesPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'images');
  }
  return path.join(process.resourcesPath, 'images');
}

// Reload .env if path is different (for packaged apps)
const envPath = getEnvPath();
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Environment variables loaded from:', envPath);
} else {
  console.error('.env file not found at:', envPath);
}

console.log('Final NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URL:', process.env.MONGO_URL);

// === Create images directory if needed ===
const imagesPath = getImagesPath();
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath, { recursive: true });
  console.log('Created images directory at:', imagesPath);
}

// === MongoDB connection options ===
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority',
};

const startServer = () => {
  // CORS and middleware
  server.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  server.use(express.json());
  server.use(express.static(path.resolve(__dirname, 'build')));
  server.use('/images', express.static(imagesPath));

  // MongoDB connection check middleware
  const checkMongoConnection = (req, res, next) => {
    console.log('Checking MongoDB connection state:', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please try again.',
        connectionState: mongoose.connection.readyState
      });
    }
    next();
  };

  // API routes
  server.use('/api/admin', checkMongoConnection, adminRouter.router);
  server.use('/api/centers', checkMongoConnection, centerRouter.router);
  server.use('/api/members', checkMongoConnection, memberRouter.router);

  // Serve React app
  server.use('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });

  // Error handler
  server.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start Express server
  const PORT = process.env.PORT || 8080;
  const serverInstance = server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}...`);
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('MongoDB Atlas connection closed on app termination');
      process.exit(0);
    });
  });

  module.exports = serverInstance;
};

// === MongoDB Connect Logic ===
const connectWithRetry = async () => {
  console.log('Connecting to MongoDB Atlas...');
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB Atlas');
      return startServer();
    }

    if (mongoose.connection.readyState === 2) {
      console.log('Already connecting to MongoDB Atlas...');
      return;
    }

    await mongoose.connect(process.env.MONGO_URL, mongoOptions);
    console.log('MongoDB Atlas connected successfully');
    startServer();
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();
