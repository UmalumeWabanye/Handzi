const router = require('express').Router();
const { body } = require('express-validator');
const { MODES } = require('@handyconnect/shared');
const ctrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isUploadPath, locationRules } = require('../middleware/validators');
const h = require('../utils/asyncHandler');

router.use(protect);

const interests = [body('interests').optional().isArray({ max: 20 }), body('interests.*').isMongoId()];
const avatar = body('avatar').optional().custom(isUploadPath).withMessage('Invalid avatar');

router.patch(
  '/me',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    avatar,
    ...interests,
    ...locationRules('location', { optional: true }),
  ],
  validate,
  h(ctrl.updateMe)
);
router.post('/me/onboarding/client', [avatar, ...interests, ...locationRules('location')], validate, h(ctrl.completeClientOnboarding));
router.post('/me/mode', [body('mode').isIn(Object.values(MODES))], validate, h(ctrl.switchMode));
router.post('/me/handyman', h(ctrl.becomeHandyman));
router.post('/me/push-tokens', [body('token').isString().notEmpty()], validate, h(ctrl.registerPushToken));

module.exports = router;
