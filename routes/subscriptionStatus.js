const express = require('express');
const router = express.Router();

const { subscriptionsDb } = require('./payments'); // same shared DB

// GET subscription status
router.get('/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sub = subscriptionsDb[sessionId];

  if (!sub) {
    return res.json({ status: 'none' });
  }

  // Determine if trial or active
  let status = 'none';
  if (sub.status === 'active') {
    if (sub.trial_end && Date.now() < sub.trial_end * 1000) {
      status = 'trial';
    } else {
      status = 'subscribed';
    }
  } else {
    status = sub.status; // could be 'failed', 'cancelled', etc.
  }

  res.json({ status });
});

module.exports = router;
