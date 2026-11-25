const { Category } = require('../models');

exports.list = async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ success: true, categories });
};
