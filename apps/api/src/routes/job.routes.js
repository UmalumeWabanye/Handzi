const router = require('express').Router();
const { body, query } = require('express-validator');
const { JOB_URGENCY, JOB_DESCRIPTION_MIN, JOB_MAX_PHOTOS, QUOTE_MESSAGE_MIN } = require('@handyconnect/shared');
const jobs = require('../controllers/job.controller');
const quotes = require('../controllers/quote.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isUploadPath, locationRules } = require('../middleware/validators');
const h = require('../utils/asyncHandler');

router.use(protect);

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const jobRules = [
  body('category').isMongoId().withMessage('Pick a trade'),
  body('subcategory').optional().isString().isLength({ max: 80 }),
  body('title').isString().trim().isLength({ min: 5, max: 120 }).withMessage('Add a short title (5–120 characters)'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: JOB_DESCRIPTION_MIN, max: 4000 })
    .withMessage(`Describe the job in at least ${JOB_DESCRIPTION_MIN} characters`),
  body('photos').optional().isArray({ max: JOB_MAX_PHOTOS }),
  body('photos.*').custom(isUploadPath).withMessage('Invalid photo'),
  body('budget').optional().isObject(),
  body('budget.min').optional({ values: 'null' }).isFloat({ min: 0, max: 1_000_000 }),
  body('budget.max').optional({ values: 'null' }).isFloat({ min: 0, max: 1_000_000 }),
  body('urgency').optional().isIn(Object.values(JOB_URGENCY)),
  body('preferredDate')
    .optional({ values: 'null' })
    .isISO8601()
    .custom((v) => new Date(v) >= today())
    .withMessage('Preferred date cannot be in the past'),
  ...locationRules('location', { optional: true }),
];

const quoteRules = (optional) => {
  const o = (chain) => (optional ? chain.optional() : chain);
  return [
    o(body('amount')).isFloat({ min: 50, max: 1_000_000 }).withMessage('Enter a price of at least R50'),
    o(body('message')).isString().trim().isLength({ min: QUOTE_MESSAGE_MIN, max: 2000 }).withMessage(`Write at least ${QUOTE_MESSAGE_MIN} characters to the client`),
    body('estimatedDuration').optional().isString().isLength({ max: 40 }),
    body('availableFrom')
      .optional({ values: 'null' })
      .isISO8601()
      .custom((v) => new Date(v) >= today())
      .withMessage('Start date cannot be in the past'),
  ];
};

router.post('/', jobRules, validate, h(jobs.create));
router.get('/mine', h(jobs.mine));
router.get(
  '/feed',
  requireRole('handyman'),
  [query('scope').optional().isIn(['mine', 'all']), query('sort').optional().isIn(['distance', 'newest']), query('radiusKm').optional().isInt({ min: 1, max: 200 })],
  validate,
  h(jobs.feed)
);
router.get('/:id', h(jobs.get));
router.post('/:id/cancel', h(jobs.cancel));
router.get('/:jobId/quotes', h(quotes.forJob));
router.post('/:jobId/quotes', requireRole('handyman'), quoteRules(false), validate, h(quotes.create));

module.exports = router;
module.exports.quoteRules = quoteRules;
