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
    console.log("AI Scan: Starting analysis...");
    
    // Cleanup base64 and determine mime type
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].split(':')[1];
      base64Data = parts[1];
    } else {
      base64Data = imageBase64;
    }

    // Gemini only supports certain image types
    const supportedMimes = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];
    if (!supportedMimes.includes(mimeType)) {
      mimeType = "image/jpeg"; // Fallback
    }

    console.log(`AI Scan: Using mimeType ${mimeType}, Data length: ${base64Data.length}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Identify this food item. Return ONLY a JSON object with: 'name', 'category' (Produce, Bakery, Dairy, Prepared Meals, Meat, Beverages, Grains, Other), and 'shelfLifeHours'. NO markdown, NO code blocks, just the JSON string." },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API Error:", JSON.stringify(data));
      return res.status(response.status).json({ error: "Gemini error: " + (data.error?.message || "Unknown") });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Gemini Raw Text:", text);

    if (!text) throw new Error("AI returned empty content");

    // Clean text to extract JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    res.json(result);
  } catch (err) {
    console.error("AI Analysis Backend Error:", err.message);
    res.status(500).json({ error: "AI Error: " + err.message });
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

