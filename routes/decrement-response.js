const express = require('express');
const { db } = require('../firebase'); // Firestore connection
const router = express.Router();

/**
 * ✅ Decrement a user's responses_remaining by 1
 * Ensures value never goes below 0
 */
router.post('/', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentResponses = userDoc.data().responses_remaining || 0;

    if (currentResponses <= 0) {
      return res.status(400).json({ error: 'No responses remaining' });
    }

    await userRef.update({
      responses_remaining: currentResponses - 1
    });

    res.json({ success: true, responses_remaining: currentResponses - 1 });
  } catch (err) {
    console.error('❌ Failed to decrement response:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
