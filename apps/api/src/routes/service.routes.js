const router = require('express').Router();
const { body, query } = require('express-validator');
const { PRICING_TYPE, SERVICE_MAX_TIERS, SERVICE_DESCRIPTION_MIN, PORTFOLIO_MAX_PHOTOS } = require('@handyconnect/shared');
const ctrl = require('../controllers/service.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isUploadPath, locationRules } = require('../middleware/validators');
const h = require('../utils/asyncHandler');

router.use(protect);

const rules = (optional) => {
  const o = (chain) => (optional ? chain.optional() : chain);
  return [
    o(body('category')).isMongoId().withMessage('Pick a trade'),
    body('subcategory').optional({ values: 'null' }).isString().isLength({ max: 80 }),
    o(body('title')).isString().trim().isLength({ min: 5, max: 100 }).withMessage('Give the service a short title (5–100 characters)'),
    o(body('description'))
      .isString()
      .trim()
      .isLength({ min: SERVICE_DESCRIPTION_MIN, max: 3000 })
      .withMessage(`Describe what's included (at least ${SERVICE_DESCRIPTION_MIN} characters)`),
    body('photos').optional().isArray({ max: PORTFOLIO_MAX_PHOTOS }),
    body('photos.*').custom(isUploadPath).withMessage('Invalid photo'),
    o(body('pricingType')).isIn(Object.values(PRICING_TYPE)).withMessage('Choose how you price this service'),
    body('tiers').optional().isArray({ max: SERVICE_MAX_TIERS }).withMessage(`Up to ${SERVICE_MAX_TIERS} packages`),
    body('tiers.*.name').isString().trim().isLength({ min: 1, max: 30 }).withMessage('Name each package'),
    body('tiers.*.price').isFloat({ min: 50, max: 1_000_000 }).withMessage('Each package needs a price of at least R50'),
    body('tiers.*.description').optional({ values: 'null' }).isString().isLength({ max: 500 }),
    body('tiers.*.estimatedHours').optional({ values: 'null' }).isFloat({ min: 0.5, max: 200 }),
    body('active').optional().isBoolean(),
  ];
};

router.get(
  '/search',
  [
    query('q').optional().isString().isLength({ max: 80 }),
    query('category').optional().isMongoId(),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 }),
    query('radiusKm').optional().isInt({ min: 1, max: 200 }),
  ],
  validate,
  h(ctrl.search)
);
router.get('/mine', requireRole('handyman'), h(ctrl.mine));
router.get('/by/:userId', h(ctrl.byHandyman));
router.post('/', requireRole('handyman'), rules(false), validate, h(ctrl.create));
router.get('/:id', h(ctrl.get));
router.patch('/:id', requireRole('handyman'), rules(true), validate, h(ctrl.update));
router.delete('/:id', requireRole('handyman'), h(ctrl.remove));
router.post(
  '/:id/book',
  [
    body('tierId').isMongoId().withMessage('Choose a package'),
    body('scheduledFor').optional({ values: 'null' }).isISO8601(),
    body('note').optional().isString().isLength({ max: 1000 }),
    ...locationRules('location', { optional: true }),
  ],
  validate,
  h(ctrl.book)
);

module.exports = router;
