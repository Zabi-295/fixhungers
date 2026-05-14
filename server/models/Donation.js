const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: String, required: true },
  unit: { type: String, required: true },
  expiryDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'In Transit', 'Collected', 'Accepted'],
    default: 'Pending'
  },
  notes: { type: String },
  emoji: { type: String },
  image: { type: String },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerName: { type: String },
  providerAddress: { type: String },
  providerPhone: { type: String },
  providerLat: { type: Number },
  providerLng: { type: Number },
  acceptedBy: { type: String },
  acceptedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: String },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Donation', DonationSchema);
