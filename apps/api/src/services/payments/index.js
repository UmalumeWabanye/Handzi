// Payment provider selected by PAYMENT_PROVIDER. Only `mock` exists for the MVP;
// add `paystack.js` with the same charge/refund/payout functions to go live.
const providers = { mock: require('./mock') };

const name = process.env.PAYMENT_PROVIDER || 'mock';
if (!providers[name]) throw new Error(`Unknown PAYMENT_PROVIDER "${name}"`);

module.exports = providers[name];
