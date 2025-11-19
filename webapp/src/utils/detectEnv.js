// /webapp/src/utils/detectEnv.js
// Environment detection based on hostname
// ReminderApp Ver.2.8.1

/**
 * Detect environment mode based on current hostname
 * @returns {string} "dev" or "prod"
 */
export const detectEnv = () => {
  const host = window.location.hostname;
  
  // Development: localhost or 127.0.0.1
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return "dev";
  }
  
  // Production: reminderapp.web.app
  if (host.includes("reminderapp.web.app")) {
    return "prod";
  }
  
  // Default to dev for safety
  return "dev";
};

/**
 * Get current environment mode
 * Alias for detectEnv for consistency with spec
 * @returns {string} "dev" or "prod"
 */
export const getEnvMode = () => {
  return detectEnv();
};

/**
 * Check if currently in development mode
 * @returns {boolean}
 */
export const isDev = () => {
  return detectEnv() === "dev";
};

/**
 * Check if currently in production mode
 * @returns {boolean}
 */
export const isProd = () => {
  return detectEnv() === "prod";
};