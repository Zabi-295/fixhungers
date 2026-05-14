const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation.js');
const User = require('../models/User');
const auth = require('../middleware/auth.js');
const mongoose = require('mongoose');

// @route    GET api/donations
// ... (rest of the code)


// @route    GET api/donations
// @desc     Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/donations
// @desc     Create a donation
router.post('/', auth, async (req, res) => {
  console.log("Donation request body:", req.body);
  console.log("User from token:", req.user);
  try {
    const newDonation = new Donation({
      ...req.body,
      providerId: req.user.id
    });

    const donation = await newDonation.save();
    console.log("Donation created successfully:", donation._id);
    res.json(donation);
  } catch (err) {
    console.error("Donation creation error:", err);
    res.status(500).send('Server Error: ' + err.message);
  }
});

// @route    PUT api/donations/:id
// @desc     Update a donation
router.put('/:id', auth, async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ msg: 'Donation not found' });

    donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(donation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/donations/:id
// @desc     Delete a donation
router.delete('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ msg: 'Donation not found' });

    await Donation.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Donation removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/donations/:id/review
// @desc     Add a review for an NGO
router.post('/:id/review', auth, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    let donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ msg: 'Donation not found' });
    
    const ngoId = donation.acceptedById;
    if (!ngoId) return res.status(400).json({ msg: 'Donation was not accepted by any NGO' });

    // 1. Save review to donation
    donation.review = {
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };
    await donation.save();

    // 2. Recalculate NGO Rating
    // Smart lookup: Check if ngoId is a valid MongoDB ObjectId or a Firebase UID
    let ngoUser = null;
    if (mongoose.Types.ObjectId.isValid(ngoId)) {
      ngoUser = await User.findById(ngoId);
    }
    if (!ngoUser) {
      ngoUser = await User.findOne({ firebaseUid: ngoId });
    }

    if (ngoUser) {
      const actualNgoId = ngoUser._id;
      const ngoDonations = await Donation.find({ 
        acceptedById: { $in: [actualNgoId, ngoUser.firebaseUid, String(actualNgoId)] }, 
        'review.rating': { $exists: true } 
      });
      
      const totalRating = ngoDonations.reduce((acc, d) => acc + d.review.rating, 0);
      const avgRating = totalRating / ngoDonations.length;

      await User.findByIdAndUpdate(actualNgoId, {
        rating: avgRating,
        reviewCount: ngoDonations.length
      });
    }

    // 3. Recalculate ALL NGO Ranks

    const ngos = await User.find({ role: 'NGO' }).sort({ rating: -1, reviewCount: -1 });
    
    const rankPromises = ngos.map((ngo, index) => {
      return User.findByIdAndUpdate(ngo._id, { rank: index + 1 });
    });
    await Promise.all(rankPromises);

    res.json({ msg: 'Review submitted and ranking updated', donation });
  } catch (err) {
    console.error("Review Error:", err.message);
    res.status(500).send('Server Error: ' + err.message);
  }
});

module.exports = router;


