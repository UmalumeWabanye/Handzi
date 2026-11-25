const router = require('express').Router();
const { body, query } = require('express-validator');
const { Notification } = require('../models');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const h = require('../utils/asyncHandler');

router.use(protect);

router.get(
  '/',
  [query('before').optional().isISO8601(), query('limit').optional().isInt({ min: 1, max: 100 })],
  validate,
  h(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const filter = { user: req.user._id };
    if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
    const [notifications, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ success: true, notifications, unread, hasMore: notifications.length === limit });
  })
);

router.get(
  '/unread-count',
  h(async (req, res) => {
    res.json({ success: true, count: await Notification.countDocuments({ user: req.user._id, read: false }) });
  })
);

// Mark specific notifications (ids) or everything as read.
router.post(
  '/read',
  [body('ids').optional().isArray({ max: 200 }), body('ids.*').isMongoId()],
  validate,
  h(async (req, res) => {
    const filter = { user: req.user._id, read: false };
    if (req.body.ids?.length) filter._id = { $in: req.body.ids };
    await Notification.updateMany(filter, { read: true });
    res.json({ success: true, unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
  })
);

module.exports = router;
