import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (role) => {
  const payload = {
    role,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    id: crypto.randomUUID(),
  };
  return btoa(JSON.stringify(payload));
};

export const validateToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch (e) {
    return null;
  }
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>?/gm, '');
};
