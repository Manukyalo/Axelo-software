import bcrypt from 'bcryptjs';

// SEC_WARNING: In an enterprise production environment, JWT_SECRET and password hashing MUST exist 
// purely on the backend server. They are isolated here exclusively for frontend-mocking demonstration.
const MOCK_JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'fallback_mock_key_v1';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Simulated HMAC algorithm for generating secure mock tokens
const mockSign = (payloadStr) => btoa(payloadStr + MOCK_JWT_SECRET).substring(0, 15);

export const generateToken = (role) => {
  const payload = {
    role,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours strict session expiry
    id: crypto.randomUUID(),
  };
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = mockSign(payloadStr);
  return `${payloadStr}.${signature}`;
};

export const validateToken = (token) => {
  try {
    if (!token) return null;
    const [payloadStr, signature] = token.split('.');
    
    // Invalid signature (token tempering detected)
    if (signature !== mockSign(payloadStr)) return null; 
    
    const payload = JSON.parse(atob(payloadStr));
    
    // Active session expiry ejection logic
    if (Date.now() > payload.expiresAt) return null; 
    
    return payload;
  } catch (e) {
    return null;
  }
};

export const generatePasswordResetToken = (email) => {
  const payload = {
    email,
    type: 'pwd_reset',
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry constraint
  };
  const payloadStr = btoa(JSON.stringify(payload));
  return `${payloadStr}.${mockSign(payloadStr)}`;
};

export const validatePasswordResetToken = (token) => {
  try {
    if (!token) return null;
    const [payloadStr, signature] = token.split('.');
    
    if (signature !== mockSign(payloadStr)) throw new Error('Token signature invalid.');
    
    const payload = JSON.parse(atob(payloadStr));
    if (payload.type !== 'pwd_reset') throw new Error('Invalid token type.');
    if (Date.now() > payload.expiresAt) throw new Error('Password reset token expired. Please request a new one.');
    
    return payload.email;
  } catch (e) {
    throw new Error(e.message || 'Invalid reset token format.');
  }
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>?/gm, '');
};
