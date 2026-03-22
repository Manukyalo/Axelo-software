import { logger } from './logger';

export const checkRateLimit = (endpoint, limit, timeWindowMs) => {
    // Generate isolated key for global IP-level mock tracking
    const key = `throttle_rt_${endpoint}`;
    const now = Date.now();
    
    let history = [];
    try {
        const raw = localStorage.getItem(key);
        if (raw) history = JSON.parse(raw);
        if (!Array.isArray(history)) history = [];
    } catch {
        history = []; // Failsafe against corrupted JSON tampering
    }
    
    // Prune out dead request objects falling outside the active window
    history = history.filter(time => now - time < timeWindowMs);
    
    // Enforce sliding window capacity algorithm
    // Exception forces parent try-catch to halt API execution completely
    if (history.length >= limit) {
        logger.security('Rate limit constraint breached. Terminating traffic execution loop.', { endpoint, limit, timeWindowMs });
        throw new Error(`SECURITY ALERT: Rate limit exceeded for endpoint [${endpoint}]. Please wait before trying again.`);
    }
    
    // Record successful transaction
    history.push(now);
    localStorage.setItem(key, JSON.stringify(history));
    return true;
};
