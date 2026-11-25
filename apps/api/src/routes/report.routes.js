const router = require('express').Router();
const { body } = require('express-validator');
const { REPORT_TARGET } = require('@handyconnect/shared');
const { Report } = require('../models');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const h = require('../utils/asyncHandler');

router.use(protect);

// Users flag people, jobs, messages etc. for the admin team to review.
router.post(
  '/',
  [body('targetType').isIn(Object.values(REPORT_TARGET)), body('targetId').isMongoId(), body('reason').isString().trim().isLength({ min: 3, max: 1000 })],
  validate,
  h(async (req, res) => {
    const report = await Report.create({ reporter: req.user._id, targetType: req.body.targetType, targetId: req.body.targetId, reason: req.body.reason });
    res.status(201).json({ success: true, report: { _id: report._id } });
  })
);

module.exports = router;
