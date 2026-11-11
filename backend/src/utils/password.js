const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const SYMBOLS = '@#$%&*';

function generatePassword(length = 12) {
  const chars = [];
  for (let i = 0; i < length - 2; i += 1) chars.push(ALPHABET[crypto.randomInt(ALPHABET.length)]);
  chars.push(String(crypto.randomInt(2, 10)));
  chars.push(SYMBOLS[crypto.randomInt(SYMBOLS.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const hashPassword = (plain) => bcrypt.hash(plain, 11);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
const randomToken = (bytes = 9) => crypto.randomBytes(bytes).toString('base64url');

module.exports = { generatePassword, hashPassword, verifyPassword, randomToken };
