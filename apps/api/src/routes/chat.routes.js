const router = require('express').Router();
const { body, query } = require('express-validator');
const { MESSAGE_MAX_IMAGES } = require('@handyconnect/shared');
const ctrl = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isUploadPath } = require('../middleware/validators');
const h = require('../utils/asyncHandler');

router.use(protect);

const role = query('role').optional().isIn(['client', 'handyman']);

router.get('/', role, validate, h(ctrl.list));
router.get('/unread-count', role, validate, h(ctrl.unreadCount));
router.post('/', [body('jobId').isMongoId(), body('userId').optional().isMongoId()], validate, h(ctrl.start));
router.get('/:id', h(ctrl.get));
router.get('/:id/messages', [query('before').optional().isISO8601(), query('limit').optional().isInt({ min: 1, max: 100 })], validate, h(ctrl.messages));
router.post(
  '/:id/messages',
  [
    body('text').optional().isString().isLength({ max: 4000 }),
    body('images').optional().isArray({ max: MESSAGE_MAX_IMAGES }),
    body('images.*').custom(isUploadPath),
    body('clientId').optional().isString().isLength({ max: 64 }),
  ],
  validate,
  h(ctrl.send)
);
router.post('/:id/read', h(ctrl.markRead));
router.post('/:id/block', h(ctrl.block));
router.post('/:id/unblock', h(ctrl.unblock));

module.exports = router;
