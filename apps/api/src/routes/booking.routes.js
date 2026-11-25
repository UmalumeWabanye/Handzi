const router = require('express').Router();
const { body, query } = require('express-validator');
const ctrl = require('../controllers/booking.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const h = require('../utils/asyncHandler');

router.use(protect);

router.get('/', query('role').optional().isIn(['client', 'handyman']), validate, h(ctrl.list));
router.get('/earnings', requireRole('handyman'), h(ctrl.earnings));
router.get('/:id', h(ctrl.get));
router.post('/:id/pay', body('simulate').optional().isIn(['success', 'decline']), validate, h(ctrl.pay));
router.post('/:id/start', h(ctrl.start));
router.post('/:id/complete', h(ctrl.complete));
router.post('/:id/confirm', h(ctrl.confirm));
router.post('/:id/cancel', body('reason').optional().isString().isLength({ max: 500 }), validate, h(ctrl.cancel));
router.post(
  '/:id/dispute',
  [body('reason').isString().trim().isLength({ min: 10, max: 2000 }).withMessage('Tell us what went wrong (at least 10 characters)'), body('evidence').optional().isArray({ max: 6 })],
  validate,
  h(ctrl.dispute)
);
router.post(
  '/:id/review',
  [body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose 1 to 5 stars'), body('text').optional().isString().trim().isLength({ max: 1000 })],
  validate,
  h(ctrl.review)
);

module.exports = router;
