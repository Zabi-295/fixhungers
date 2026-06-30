const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const authRoutes = require('../server/routes/auth');
const donationRoutes = require('../server/routes/donations');
const userRoutes = require('../server/routes/users');
const chatRoutes = require('../server/routes/chats');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set('io', io);

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  // Join user to private room
  socket.on('join', async (userId) => {
    socket.join(userId);
    console.log(`Socket client joined room: ${userId}`);

    // Mark pending messages as delivered
    try {
      const Message = require('../server/models/Message');
      await Message.updateMany({ receiver: userId, delivered: false }, { delivered: true });
      socket.broadcast.to(userId).emit('messagesDelivered', { receiverId: userId });
    } catch (err) {
      console.error('Socket join delivered update error:', err.message);
    }
  });

  // Real-time message transfer
  socket.on('sendMessage', async (data) => {
    let { sender, receiver, content, file_url, file_type, file_name } = data;
    try {
      const Message = require('../server/models/Message');
      const User = require('../server/models/User');

      // Upload to Cloudinary if base64 Data URL and Cloudinary is configured
      if (file_url && file_url.startsWith('data:')) {
        const { uploadToBase64 } = require('../server/utils/cloudinary');
        const cloudinaryUrl = await uploadToBase64(file_url);
        if (cloudinaryUrl) {
          file_url = cloudinaryUrl;
        }
      }

      const receiverRoom = io.sockets.adapter.rooms.get(receiver);
      const isOnline = receiverRoom && receiverRoom.size > 0;
      const delivered = isOnline ? true : false;

      const newMessage = new Message({
        sender,
        receiver,
        content,
        file_url,
        file_type,
        file_name,
        delivered,
        read: false
      });

      await newMessage.save();

      const senderUser = await User.findById(sender);

      const formattedMessage = {
        _id: newMessage._id,
        senderId: sender,
        senderName: senderUser?.name || 'User',
        role: senderUser?.role || 'Provider',
        message: content || '',
        file_url,
        file_type,
        file_name,
        read: false,
        delivered,
        createdAt: newMessage.createdAt
      };

      // Send to receiver
      io.to(receiver).emit('receiveMessage', formattedMessage);
      // Confirm to sender
      socket.emit('messageSent', formattedMessage);

    } catch (err) {
      console.error('Socket sendMessage error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

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
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Removed Temporary Admin Bypass as it caused normal users to gain admin privileges.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/support', require('../server/routes/support'));

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
      "Identify this food item. Return ONLY a JSON object with keys: 'name', 'category', and 'shelfLifeHours'. IMPORTANT constraints: 1. This donation is for immediate local distribution within a single city to prevent food spoilage. 2. Based on the food type, set a short and conservative shelfLifeHours (must be between 2 and 8 hours max: e.g., cooked hot foods/meals should be 2-3 hours, bakery/dairy 4-6 hours, beverages 6-8 hours). Do NOT exceed 8 hours under any circumstances. 3. The category must be one of: 'Produce', 'Bakery', 'Dairy', 'Prepared Meals', 'Meat', 'Beverages', 'Grains', 'Other'.",
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

// Public Landing Data Endpoint
app.get('/api/public/landing', async (req, res) => {
  try {
    const Donation = require('../server/models/Donation');
    const User = require('../server/models/User');

    // 1. Calculate stats
    const totalCompleted = await Donation.countDocuments({ status: 'Collected' });
    const totalDonations = await Donation.countDocuments();
    const totalNGOs = await User.countDocuments({ role: 'NGO', isActive: true });
    const totalProviders = await User.countDocuments({ role: 'Provider', isActive: true });

    // 2. Fetch top 3 NGOs sorted by rating/reviews and rank
    const topNGOs = await User.find({ role: 'NGO', isActive: true, rating: { $gt: 0 } })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(3)
      .select('name rating reviewCount profile rank');

    // 3. Fetch top 3 Providers (active, sorted by newest)
    const topProviders = await User.find({ role: 'Provider', isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name profile');

    res.json({
      stats: {
        completedRescues: totalCompleted || 124, // Fallback visual stats if 0
        totalDonations: totalDonations || 158,
        activeNGOs: totalNGOs || 12,
        activeProviders: totalProviders || 18
      },
      topNGOs,
      topProviders
    });
  } catch (err) {
    console.error("Landing data error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;