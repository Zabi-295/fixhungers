const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const cors = require('cors');
require('dotenv').config();

// const authRoutes = require('./routes/auth.js');
// const donationRoutes = require('./routes/donations.js');
// const userRoutes = require('./routes/users.js');

const authRoutes = require('../server/routes/auth.js');
const donationRoutes = require('../server/routes/donations.js');
const userRoutes = require('../server/routes/users.js');

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

// MongoDB Connection Caching for Vercel
const PORT = process.env.PORT || 5000;
let isConnected = false;

const connectDB = async () => {
  // isConnected check ko behtar karne ke liye mongoose ka built-in state use karein
  if (mongoose.connection.readyState === 1) return;

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined');
    return;
  }

  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // YE LINE ADD KAREIN: Connection ke bagair query ko queue nahi hone degi
    });

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

// Gemini AI Food Analysis Endpoint
app.post('/api/ai/analyze-food', async (req, res) => {
  const { imageBase64 } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server" });
  }

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }

  try {
    // Remove base64 header if present (data:image/jpeg;base64,...)
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Identify this food item. Return ONLY a JSON object with keys: 'name' (common name), 'category' (one of: Produce, Bakery, Dairy, Prepared Meals, Meat, Beverages, Grains, Other), and 'shelfLifeHours' (estimated hours left). Example: {\"name\": \"Apple\", \"category\": \"Produce\", \"shelfLifeHours\": 72}. If you cannot identify it, return {\"error\": \"unknown\"}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log("Gemini Raw Response:", JSON.stringify(data));

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("No response from Gemini");

    // Extract JSON from response (Gemini sometimes adds markdown blocks)
    const jsonMatch = textResponse.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error("Invalid JSON in Gemini response");
    
    const result = JSON.parse(jsonMatch[0]);
    if (result.error) throw new Error("Food not recognized");

    res.json(result);
  } catch (err) {
    console.error("Gemini AI Error:", err.message);
    res.status(500).json({ error: "AI analysis failed: " + err.message });
  }
});

// Basic health check
app.get('/', (req, res) => {
  res.send('Fix Hunger API is running...');
});





// Bind to 0.0.0.0 for Render deployment or local
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;

