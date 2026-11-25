const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after express-validator chains; returns 400 with field errors.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  next(ApiError.badRequest('Validation failed', result.array().map((e) => ({ field: e.path, message: e.msg }))));
};
