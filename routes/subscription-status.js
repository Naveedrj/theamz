const express = require('express');
const router = express.Router();

const { subscriptionsDb } = require('./payments'); // shared in-memory DB

// GET subscription status by UID
router.get('/:uid', (req, res) => {
  const uid = req.params.uid;
  const sub = subscriptionsDb[uid]; // store subscriptions with UID as key

  if (!sub) {
    return res.json({ status: 'none' });
  }

  let status = 'none';
  if (sub.status === 'active') {
    if (sub.trial_end && Date.now() < sub.trial_end * 1000) {
      status = 'trial';
    } else {
      status = 'subscribed';
    }
  } else {
    status = sub.status; // failed, cancelled, etc.
  }

  res.json({ status });
});

module.exports = router;
