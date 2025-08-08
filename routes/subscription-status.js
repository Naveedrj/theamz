// subscription-status.js
const express = require('express');
const { db } = require('../firebase'); // Firestore connection
const router = express.Router();

/**
 * ✅ Get subscription status for a given UID (userId)
 * Pulls directly from Firestore so status is always the latest from payments/webhooks
 */
router.get('/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;

    if (!uid) {
      return res.status(400).json({ error: 'Missing UID' });
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.json({ status: 'none', responses_remaining: 0 });
    }

    const data = userDoc.data();

    // Normalize output for Flutter
    res.json({
      status: data.status || 'none',
      free_trial_active: !!data.free_trial_active,
      subscription_active: !!data.subscription_active,
      trial_start_date: data.trial_start_date || null,
      subscription_start_date: data.subscription_start_date || null,
      responses_remaining: data.responses_remaining ?? 0 // 🎯 include quota
    });
  } catch (err) {
    console.error('❌ Failed to fetch subscription status:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
