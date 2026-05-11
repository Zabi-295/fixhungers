const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation.js');
const auth = require('../middleware/auth.js');

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

module.exports = router;
