const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { PRIVATE_UPLOAD_KINDS } = require('@handyconnect/shared');

// Local disk storage for development. Swap for Cloudinary/S3 in production (keep the same return shape).
const ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PRIVATE_DIR = path.join(ROOT, 'private');

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' };
const PRIVATE_NAME = /^([a-f0-9]{24})-[a-f0-9]{32}\.(jpg|png|webp|heic|heif)$/;

async function save({ buffer, mimetype, kind, userId }) {
  const ext = EXT[mimetype];
  const isPrivate = PRIVATE_UPLOAD_KINDS.includes(kind);
  const id = crypto.randomBytes(16).toString('hex');

  if (isPrivate) {
    // Owner id in the file name lets us authorise reads without a DB lookup.
    const name = `${userId}-${id}.${ext}`;
    await fs.mkdir(PRIVATE_DIR, { recursive: true });
    await fs.writeFile(path.join(PRIVATE_DIR, name), buffer);
    return { url: `/api/v1/uploads/private/${name}`, private: true };
  }
  const name = `${kind}-${id}.${ext}`;
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_DIR, name), buffer);
  return { url: `/uploads/${name}`, private: false };
}

// Returns the absolute path of a private file if `user` may read it, else null.
function resolvePrivate(name, user) {
  const m = PRIVATE_NAME.exec(name);
  if (!m) return null;
  const owner = m[1];
  if (owner !== user._id.toString() && !user.roles.includes('admin')) return null;
  return path.join(PRIVATE_DIR, name);
}

const ownsPrivateUrl = (url, userId) =>
  typeof url === 'string' && url.startsWith(`/api/v1/uploads/private/${userId}-`);

module.exports = { save, resolvePrivate, ownsPrivateUrl, PUBLIC_DIR, ACCEPTED_TYPES: Object.keys(EXT) };
