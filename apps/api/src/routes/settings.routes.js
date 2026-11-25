const router = require('express').Router();
const { Setting } = require('../models');
const h = require('../utils/asyncHandler');

// Public platform settings the apps need (e.g. to show the service fee on a quote).
router.get(
  '/public',
  h(async (req, res) => {
    const s = await Setting.get();
    res.json({ success: true, settings: { commissionPercent: s.commissionPercent, autoConfirmHours: s.autoConfirmHours } });
  })
);

module.exports = router;
