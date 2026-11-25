const router = require('express').Router();
const { body, query } = require('express-validator');
const { USER_STATUS, REPORT_STATUS, DISPUTE_RESOLUTION } = require('@handyconnect/shared');
const overview = require('../controllers/admin/overview.controller');
const people = require('../controllers/admin/people.controller');
const content = require('../controllers/admin/content.controller');
const money = require('../controllers/admin/money.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const h = require('../utils/asyncHandler');

// Everything here is admin-only, and every write is recorded in the audit log.
router.use(protect, requireRole('admin'));

const reason = (min = 3) => body('reason').isString().trim().isLength({ min, max: 1000 }).withMessage(`Give a reason (${min}+ characters)`);

router.get('/stats', query('days').optional().isInt({ min: 7, max: 90 }), validate, h(overview.stats));
router.get('/queues', h(overview.queues));

router.get('/verifications', query('status').optional().isIn(['pending', 'verified', 'rejected']), validate, h(people.verifications));
router.post('/verifications/:userId/approve', h(people.approveVerification));
router.post('/verifications/:userId/reject', reason(5), validate, h(people.rejectVerification));
router.post('/handymen/:userId/certifications/:certId/verify', body('verified').optional().isBoolean(), validate, h(people.verifyCertification));

router.get('/users', h(people.users));
router.get('/users/:id', h(people.user));
router.post('/users/:id/status', [body('status').isIn(Object.values(USER_STATUS)), body('reason').optional().isString().isLength({ max: 1000 })], validate, h(people.setUserStatus));

router.get('/jobs', h(content.jobs));
router.get('/jobs/:id', h(content.job));
router.post('/jobs/:id/removal', [body('removed').isBoolean(), body('reason').optional().isString().isLength({ max: 1000 })], validate, h(content.setJobRemoved));

router.get('/reports', query('status').optional().isIn(Object.values(REPORT_STATUS)), validate, h(content.reports));
router.post('/reports/:id', [body('status').isIn([REPORT_STATUS.ACTIONED, REPORT_STATUS.DISMISSED]), body('note').optional().isString().isLength({ max: 1000 })], validate, h(content.handleReport));
router.post('/messages/:id/hidden', body('hidden').isBoolean(), validate, h(content.setMessageHidden));
router.post('/reviews/:id/hidden', body('hidden').isBoolean(), validate, h(content.setReviewHidden));

router.get('/bookings', h(money.bookings));
router.get('/bookings/:id', h(money.booking));
router.get('/disputes', h(money.disputes));
router.get('/disputes/:id', h(money.dispute));
router.post('/disputes/:id/notes', body('text').isString().trim().isLength({ min: 1, max: 2000 }), validate, h(money.addDisputeNote));
router.post(
  '/disputes/:id/resolve',
  [body('outcome').isIn(Object.values(DISPUTE_RESOLUTION)), body('refundAmount').optional().isFloat({ min: 0 }), body('note').optional().isString().isLength({ max: 1000 })],
  validate,
  h(money.resolveDispute)
);

router.get('/categories', h(content.categories));
const categoryRules = (optional) => [
  (optional ? body('name').optional() : body('name')).isString().trim().isLength({ min: 2, max: 60 }),
  body('slug').optional().isString().matches(/^[a-z0-9-]+$/),
  body('icon').optional().isString().isLength({ max: 60 }),
  body('subcategories').optional().isArray({ max: 30 }),
  body('subcategories.*').isString().trim().isLength({ min: 1, max: 60 }),
  body('active').optional().isBoolean(),
  body('sortOrder').optional().isInt({ min: 0, max: 1000 }),
];
router.post('/categories', categoryRules(false), validate, h(content.createCategory));
router.patch('/categories/:id', categoryRules(true), validate, h(content.updateCategory));

router.get('/settings', h(content.settings));
router.patch(
  '/settings',
  [body('commissionPercent').optional().isFloat({ min: 0, max: 50 }), body('autoConfirmHours').optional().isInt({ min: 1, max: 720 })],
  validate,
  h(content.updateSettings)
);

router.get('/audit', h(content.auditLog));

module.exports = router;
