import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Generate a proper 32-byte key from the secret
function getKey() {
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

// Encrypt filename WITH folder info and additional metadata
export function encryptFileId(filename, folder = 'default', metadata = {}) {
  try {
    // Combine folder, filename, and optional metadata into one encrypted string
    const dataToEncrypt = JSON.stringify({ 
      folder, 
      filename,
      timestamp: Date.now(), // Add timestamp for uniqueness
      ...metadata 
    });
    
    const iv = crypto.randomBytes(16);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const combined = iv.toString('hex') + ':' + encrypted;
    
    // Make it URL-safe by encoding
    return Buffer.from(combined).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

// Decrypt obfuscated ID to get filename, folder, and metadata
export function decryptFileId(encryptedId) {
  try {
    // Decode from URL-safe base64
    const base64 = encryptedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const combined = Buffer.from(padded, 'base64').toString('utf8');
    
    const [ivHex, encrypted] = combined.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted ID format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse the JSON to get folder, filename, and metadata
    const data = JSON.parse(decrypted);
    return data; // Returns { folder, filename, timestamp, ...metadata }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Invalid or corrupted file ID');
  }
}

// Generate access token for time-limited or one-time access
export function generateAccessToken(fileId, options = {}) {
  const {
    expiresIn = 3600, // seconds (default 1 hour)
    maxUses = null,
    allowedEmails = []
  } = options;
  
  const tokenData = {
    fileId,
    expiresAt: Date.now() + (expiresIn * 1000),
    maxUses,
    allowedEmails,
    createdAt: Date.now()
  };
  
  return encryptFileId(fileId, 'token', tokenData);
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    const data = decryptFileId(token);
    
    // Check expiration
    if (data.expiresAt && Date.now() > data.expiresAt) {
      throw new Error('Token expired');
    }
    
    return {
      valid: true,
      data
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Helper to create file metadata object
export function createFileMetadata(file, type, port, additionalData = {}) {
  const encryptedId = encryptFileId(file.filename, type);
  
  return {
    fileId: encryptedId,
    fileName: file.originalname,
    savedFileName: file.filename,
    fileUrl: `http://localhost:${port}/f/${encryptedId}`,
    viewUrl: `http://localhost:${port}/f/${encryptedId}`,
    downloadUrl: `http://localhost:${port}/f/${encryptedId}?d=1`,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size,
    type: type,
    ...additionalData
  };
}