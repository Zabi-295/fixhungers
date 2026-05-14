const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'NGO', 'Provider'],
    required: true
  },
  profile: {
    // For Providers
    orgName: String,
    orgType: String,
    // For NGOs
    fullName: String,
    vehicleType: String,
    // Common
    phone: String,
    address: String,
    location: String,
    lat: Number,
    lng: Number,
    isOnline: Boolean,
    joinedDate: String,
    // Settings
    pickupConfirmations: Boolean,
    volunteerTracking: Boolean,
    dailySummary: Boolean,
    newRescueAlerts: Boolean,
    pushNotifications: Boolean,
    weeklyReport: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  },
  firebaseUid: {
    type: String,
    unique: true
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  rank: { type: Number, default: 0 }

});

module.exports = mongoose.model('User', UserSchema);
