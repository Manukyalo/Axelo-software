// Centralized Security & Telemetry Event Logger

export const logger = {
  info: (message, context = {}) => {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context);
  },
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context);
  },
  error: (message, context = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, context);
  },
  security: (message, context = {}) => {
    console.error(`🚨 [SECURITY_ALERT] ${new Date().toISOString()} - ${message}`, context);
    // STUB: In production, sync this forcefully to Datadog/Sentry or an external SIEM backend API.
  }
};
