const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('./index'); // Import the Express server
const fs = require('fs');

let mainWindow;

// Function to get the correct .env file path
function getEnvPath() {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '.env');
  }
  // In production (packaged app)
  return path.join(process.resourcesPath, '.env');
}

// Load environment variables
function loadEnv() {
  const envPath = getEnvPath();
  console.log('Loading .env from:', envPath);
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('Environment variables loaded successfully');
  } else {
    console.error('.env file not found at:', envPath);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true, // Open in fullscreen
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the React app through the Express server
  mainWindow.loadURL('http://localhost:8080');

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  // Add keyboard shortcut to toggle fullscreen (F11)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Load environment variables before creating the window
loadEnv();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle server shutdown when app is quitting
app.on('before-quit', () => {
  // Add any cleanup code here if needed
}); 