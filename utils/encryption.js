const crypto = require('crypto');

const algorithm = process.env.CRYPTO_ALGORITHM || 'aes-256-cbc';
const secretKey = process.env.CRYPTO_SECRET_KEY || 'your_32_character_secret_key_here';

// Encrypt text
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

// Decrypt text
const decrypt = (encryptedText) => {
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, secretKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

// Hash sensitive data (one-way)
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Encrypt object (for storing in database)
const encryptObject = (obj) => {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    throw new Error('Object encryption failed: ' + error.message);
  }
};

// Decrypt object (for retrieving from database)
const decryptObject = (encryptedString) => {
  try {
    const jsonString = decrypt(encryptedString);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Object decryption failed: ' + error.message);
  }
};

module.exports = {
  encrypt,
  decrypt,
  hashData,
  generateToken,
  encryptObject,
  decryptObject
};
