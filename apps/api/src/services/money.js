// "R2 800" (South African formatting with a thin space for thousands).
const rand = (n) => `R${Math.round(Number(n) || 0).toLocaleString('en-ZA').replace(/[, ]/g, ' ')}`;
module.exports = { rand };
