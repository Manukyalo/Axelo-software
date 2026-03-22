import { checkRateLimit } from '../utils/rateLimit';

// =========================================================================
// ENTERPRISE STUBS: Defensive Architecture
// Showcasing robust endpoint rate limiting on non-existent endpoints 
// to prevent abuse (Bots, Scraping, DDoS) against heavy processing logic
// =========================================================================

export const MockCreateRegistration = async (payload) => {
    // 🥶 Throttling: Maximum 5 account creations per hour globally 
    // Prevents automated spam rings from burning database resources
    checkRateLimit('account_creation', 5, 60 * 60 * 1000); 

    return new Promise((resolve) => setTimeout(() => resolve({ success: true, user: payload }), 800));
};

export const MockGenerateAITinerary = async (safariPrompt) => {
    // 🥶 Throttling: Maximum 20 LLM requests per 24 hours
    // Prevents malicious actors from exploiting token budgets and LLM API costs
    checkRateLimit('ai_generation', 20, 24 * 60 * 60 * 1000);

    return new Promise((resolve) => setTimeout(() => resolve({ 
        success: true, 
        tokensUsed: 450, 
        response: 'Generated itinerary struct...' 
    }), 1500));
};
