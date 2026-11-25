const router = require('express').Router();
const { body, param } = require('express-validator');
const { EMPLOYMENT_TYPES, PORTFOLIO_MAX_PHOTOS } = require('@handyconnect/shared');
const ctrl = require('../controllers/handyman.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isUploadPath, locationRules } = require('../middleware/validators');
const h = require('../utils/asyncHandler');

router.use(protect);

const handymanOnly = requireRole('handyman');
const optionalDate = (f) => body(f).optional({ values: 'null' }).isISO8601().withMessage('Invalid date');

const profileRules = [
  body('headline').optional().isString().trim().isLength({ max: 120 }),
  body('bio').optional().isString().isLength({ max: 2000 }),
  body('trades').optional().isArray({ max: 10 }),
  body('trades.*').isMongoId(),
  body('skills').optional().isArray({ max: 30 }),
  body('skills.*').isString().trim().isLength({ min: 1, max: 40 }),
  body('languages').optional().isArray({ max: 11 }),
  body('languages.*').isString().trim().isLength({ min: 1, max: 30 }),
  body('yearsExperience').optional().isInt({ min: 0, max: 70 }),
  body('hourlyRate').optional().isFloat({ min: 0, max: 100000 }),
  body('callOutFee').optional().isFloat({ min: 0, max: 100000 }),
  body('serviceRadiusKm').optional().isInt({ min: 1, max: 200 }),
  body('available').optional().isBoolean(),
  ...locationRules('serviceArea', { optional: true }),
];

const itemRules = {
  'work-history': [
    body('title').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('company').optional().isString().isLength({ max: 100 }),
    body('employmentType').optional().isIn(Object.values(EMPLOYMENT_TYPES)),
    body('location').optional().isString().isLength({ max: 100 }),
    optionalDate('startDate'),
    optionalDate('endDate'),
    body('current').optional().isBoolean(),
    body('description').optional().isString().isLength({ max: 1500 }),
  ],
  portfolio: [
    body('title').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 1500 }),
    body('category').optional({ values: 'null' }).isMongoId(),
    body('photos').optional().isArray({ min: 1, max: PORTFOLIO_MAX_PHOTOS }),
    body('photos.*').custom(isUploadPath).withMessage('Invalid photo'),
    optionalDate('completedOn'),
    body('location').optional().isString().isLength({ max: 100 }),
  ],
  certifications: [
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('issuer').optional().isString().isLength({ max: 120 }),
    body('number').optional().isString().isLength({ max: 60 }),
    body('documentUrl').optional({ values: 'null' }).isString(),
    optionalDate('issuedAt'),
    optionalDate('expiresAt'),
  ],
};

const listParam = param('list').isIn(Object.keys(itemRules)).withMessage('Unknown section');
const itemValidation = (req, res, next) => {
  const rules = itemRules[req.params.list] || [];
  Promise.all(rules.map((r) => r.run(req))).then(() => next(), next);
};

router.get('/me', handymanOnly, h(ctrl.getMine));
router.patch('/me', handymanOnly, profileRules, validate, h(ctrl.updateMine));
router.post('/me/verification', handymanOnly, [body('idDocumentUrl').isString(), body('selfieUrl').isString()], validate, h(ctrl.submitVerification));
router.post('/me/complete-onboarding', handymanOnly, h(ctrl.completeOnboarding));
router.post('/me/:list', handymanOnly, listParam, itemValidation, validate, h(ctrl.addItem));
router.patch('/me/:list/:itemId', handymanOnly, listParam, param('itemId').isMongoId(), itemValidation, validate, h(ctrl.updateItem));
router.delete('/me/:list/:itemId', handymanOnly, listParam, param('itemId').isMongoId(), validate, h(ctrl.removeItem));

router.get('/', h(ctrl.list));
router.get('/:userId/reviews', h(ctrl.reviews));
router.get('/:userId', h(ctrl.getPublic));

module.exports = router;
