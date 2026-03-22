export const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return str;
  // Strong XSS Entity Encoding
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return str.replace(reg, (match) => map[match]).trim();
};

export const validateString = (str, maxLength = 255, fieldName = 'Field', required = true) => {
  if (!str || typeof str !== 'string' || str.trim().length === 0) {
    if (required) throw new Error(`${fieldName} cannot be empty.`);
    return '';
  }
  
  if (str.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum secure length of ${maxLength} characters.`);
  }

  // Active Injection Defense Heuristics (Detects SQLi & Command Injection structural patterns)
  // By blocking these exact literals, we preemptively halt script/SQL injections before execution
  const injectionHeuristics = /(--|;|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|EXEC\s+|xp_cmdshell|bash\s+-i|\|\||&&|`|\$|\bOR\b\s+1=1)/i;
  if (injectionHeuristics.test(str)) {
    throw new Error(`SECURITY ALERT: Payload blocked. Invalid or dangerous token signature detected in ${fieldName}.`);
  }

  return sanitizeHTML(str);
};

export const validateEmail = (email) => {
  if (!email) throw new Error('Email address is strictly required.');
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new Error('Invalid email format structure.');
  }
  return validateString(email, 150, 'Email');
};

export const validateNumber = (num, min = 0, fieldName = 'Value', required = true) => {
  if (num === null || num === undefined || num === '') {
    if (required) throw new Error(`${fieldName} is strictly required.`);
    return 0;
  }
  const parsed = parseFloat(num);
  if (isNaN(parsed) || parsed < min) {
    throw new Error(`Data Constraint Failed: ${fieldName} must be a valid number >= ${min}.`);
  }
  return parsed;
};
