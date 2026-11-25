const router = require('express').Router();
const quotes = require('../controllers/quote.controller');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { quoteRules } = require('./job.routes');
const h = require('../utils/asyncHandler');

router.use(protect);

router.get('/mine', requireRole('handyman'), h(quotes.mine));
router.patch('/:id', requireRole('handyman'), quoteRules(true), validate, h(quotes.update));
router.post('/:id/withdraw', requireRole('handyman'), h(quotes.withdraw));
router.post('/:id/accept', h(quotes.accept));
router.post('/:id/decline', h(quotes.decline));

module.exports = router;
