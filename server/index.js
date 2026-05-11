const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.js');
const donationRoutes = require('./routes/donations.js');
const userRoutes = require('./routes/users.js');

const app = express();

// CORS - Allow both local and production frontend
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Add Vercel production URL if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin.includes('.vercel.app'))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now, tighten later
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.send('Fix Hunger API is running...');
});

// MongoDB Connection Caching for Vercel
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined');
    return;
  }

  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState;
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    throw err;
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Database Connection Error: ' + err.message });
  }
});



// Bind to 0.0.0.0 for Render deployment or local
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;

