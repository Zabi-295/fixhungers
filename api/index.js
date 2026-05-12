const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const authRoutes = require('../server/routes/auth');
const donationRoutes = require('../server/routes/donations');
const userRoutes = require('../server/routes/users');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Initialize Gemini
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// MongoDB Connection with Caching for Vercel
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Temporary Admin Bypass for Debugging
app.use((req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.user.id === '6a0208a67df4a81718019346') {
        decoded.user.role = 'Admin';
        req.user = decoded.user;
      }
    } catch (e) {}
  }
  next();
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
    return res.status(500).json({ error: "Gemini API key is not configured in Vercel." });
  }

  if (!imageBase64) {
    return res.status(400).json({ error: "No image data provided" });
  }

  try {
    console.log("AI Scan: Starting analysis...");
    
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].split(':')[1];
      base64Data = parts[1];
    } else {
      base64Data = imageBase64;
    }

    if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Identify this food item. Return ONLY a JSON object with: 'name', 'category' (Produce, Bakery, Dairy, Prepared Meals, Meat, Beverages, Grains, Other), and 'shelfLifeHours'. Respond with plain JSON only.";

    const result_ai = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response_ai = await result_ai.response;
    const text = response_ai.text();
    console.log("Gemini Response:", text);

    if (!text) throw new Error("AI returned empty content");

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    res.json(result);
  } catch (err) {
    console.error("AI Analysis Error:", err.message);
    res.status(500).json({ error: "AI Scan failed: " + err.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: isConnected ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
