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
  // Force v1 version explicitly
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
      // Matching your specific ID and Email from the screenshot
      if (decoded.user.id === '6a01c6788b7a039cad61fc42' || decoded.user.email === 'mianawphenomenal@gmail.com') {
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
    return res.status(500).json({ error: "Gemini API key is not configured." });
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
    
    // SMART MODEL SELECTION
    let modelToUse = "gemini-1.5-flash"; // Default
    try {
      console.log("AI Scan: Listing models to find best match...");
      const response_models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      const data_models = await response_models.json();
      const availableModels = data_models.models || [];
      
      // Try to find a compatible 1.5 model
      const bestModel = availableModels.find(m => m.name.includes('gemini-1.5-flash') || m.name.includes('gemini-1.5-pro'));
      if (bestModel) {
        modelToUse = bestModel.name.split('/').pop();
        console.log("AI Scan: Found best model:", modelToUse);
      } else if (availableModels.length > 0) {
        modelToUse = availableModels[0].name.split('/').pop();
        console.log("AI Scan: Falling back to:", modelToUse);
      }
    } catch (e) {
      console.error("Model listing failed, using default:", e.message);
    }

    const model = genAI.getGenerativeModel({ model: modelToUse }, { apiVersion: "v1beta" });



    const result_ai = await model.generateContent([
      "Identify this food item. Return ONLY a JSON object with: 'name', 'category', 'shelfLifeHours'.",
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response_ai = await result_ai.response;
    const text = response_ai.text();
    
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: "Scan failed: " + err.message });
  }
});

// Gemini AI Chatbot Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { message, context } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) return res.status(500).json({ error: "API key missing" });

  try {
    if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

    const systemPrompt = `You are a helpful Rescue Assistant for an NGO platform. 
    NGO Name: ${context.ngoProfile.fullName}
    NGO Address: ${context.ngoProfile.address || 'Not set'}
    Available Donations Count: ${context.donations.length}
    Current Donations Details: ${JSON.stringify(context.donations.slice(0, 10))}
    
    Answer the user's questions based on this data. Be concise and professional.`;

    const result = await model.generateContent([systemPrompt, message]);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
