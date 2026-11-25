const { body } = require('express-validator');

// Reusable express-validator chains.
const isUploadPath = (v) => typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('/api/v1/uploads/') || v.startsWith('https://'));

const locationRules = (field, { optional = false } = {}) => {
  const base = optional ? body(field).optional() : body(field).exists().withMessage('Location is required');
  return [
    base.isObject(),
    body(`${field}.coordinates`)
      .if(body(field).exists())
      .isArray({ min: 2, max: 2 })
      .withMessage('Location coordinates are required'),
    body(`${field}.coordinates.0`).if(body(field).exists()).isFloat({ min: -180, max: 180 }),
    body(`${field}.coordinates.1`).if(body(field).exists()).isFloat({ min: -90, max: 90 }),
    body(`${field}.address`).optional().isString().isLength({ max: 200 }),
    body(`${field}.suburb`).optional().isString().isLength({ max: 100 }),
    body(`${field}.city`).optional().isString().isLength({ max: 100 }),
    body(`${field}.province`).optional().isString().isLength({ max: 100 }),
  ];
};

module.exports = { isUploadPath, locationRules };
