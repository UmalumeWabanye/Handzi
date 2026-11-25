const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const h = require('../utils/asyncHandler');
const { MODES } = require('@handyconnect/shared');
const { isTest } = require('../config/env');

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest(),
});

const password = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters');

router.post(
  '/register',
  strictLimiter,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
    body('mode').optional().isIn(Object.values(MODES)),
    password,
  ],
  validate,
  h(ctrl.register)
);
router.post(
  '/login',
  strictLimiter,
  [body('identifier').notEmpty(), body('password').notEmpty(), body('mode').optional().isIn(Object.values(MODES))],
  validate,
  h(ctrl.login)
);
router.post(
  '/otp/send',
  strictLimiter,
  [body('phone').notEmpty(), body('purpose').optional().isIn(['verify_phone', 'reset_password'])],
  validate,
  h(ctrl.sendOtp)
);
router.post('/otp/verify', strictLimiter, [body('phone').notEmpty(), body('code').isLength({ min: 6, max: 6 })], validate, h(ctrl.verifyOtp));
router.post(
  '/password/reset',
  strictLimiter,
  [body('phone').notEmpty(), body('code').isLength({ min: 6, max: 6 }), password],
  validate,
  h(ctrl.resetPassword)
);
router.post('/refresh', [body('refreshToken').notEmpty()], validate, h(ctrl.refresh));
router.post('/logout', protect, h(ctrl.logout));
router.get('/me', protect, h(ctrl.me));

module.exports = router;
