// Spot attempts to move a conversation off-platform (phone numbers, emails, messaging apps).
// We don't block these (clients legitimately share gate codes etc.), but the app shows a safety tip.
const PHONE = /(?:\+?27|\b0)[\s.-]?[1-8]\d(?:[\s.-]?\d){7}\b/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const APPS = /\b(whats\s?app|wa\.me|telegram|signal app|instagram|facebook)\b/i;

const containsContact = (text = '') => PHONE.test(text) || EMAIL.test(text) || APPS.test(text);

module.exports = { containsContact };
