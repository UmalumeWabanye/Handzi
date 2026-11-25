const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const { UPLOAD_KINDS } = require('@handyconnect/shared');
const { protect } = require('../middleware/auth');
const storage = require('../services/storage');
const ApiError = require('../utils/ApiError');
const h = require('../utils/asyncHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    storage.ACCEPTED_TYPES.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only JPG, PNG, WEBP or HEIC images')),
});

router.post(
  '/',
  protect,
  (req, res, next) =>
    upload.single('file')(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') return next(ApiError.badRequest('Image must be under 8 MB'));
      next(err);
    }),
  h(async (req, res) => {
    const kind = req.body.kind;
    if (!Object.values(UPLOAD_KINDS).includes(kind)) throw ApiError.badRequest('Invalid upload kind');
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const result = await storage.save({ ...req.file, kind, userId: req.user._id.toString() });
    res.status(201).json({ success: true, ...result });
  })
);

// Private files (ID documents, selfies, certificates): owner or admin only.
router.get(
  '/private/:name',
  protect,
  h(async (req, res) => {
    const file = storage.resolvePrivate(req.params.name, req.user);
    if (!file || !fs.existsSync(file)) throw ApiError.notFound();
    res.set('Cache-Control', 'private, max-age=3600');
    res.sendFile(file);
  })
);

module.exports = router;
