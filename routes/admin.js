const express = require('express');
const { login, dashboardData, logout, register } = require('../controllers/auth');
const router = express.Router();

router.post('/login' , login)
.post('/register' ,register)
.post('/logout' , logout)
.get('/getDashboard',dashboardData);

exports.router = router ;