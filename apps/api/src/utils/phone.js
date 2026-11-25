// Normalise South African mobile numbers to E.164 (+27XXXXXXXXX).
function normalizeZaPhone(input) {
  if (!input) return null;
  let digits = String(input).replace(/[^\d+]/g, '');
  if (digits.startsWith('+27')) digits = digits.slice(3);
  else if (digits.startsWith('27') && digits.length === 11) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-8]\d{8}$/.test(digits)) return null;
  return `+27${digits}`;
}

module.exports = { normalizeZaPhone };
