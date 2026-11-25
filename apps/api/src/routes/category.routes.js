const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const h = require('../utils/asyncHandler');

router.get('/', h(ctrl.list));

module.exports = router;
