// /webapp/src/utils/firestorePrefix.js
// Firestore collection prefix utility for environment separation
// ReminderApp Ver.2.8.1

/**
 * Get prefixed collection name based on environment mode
 * @param {string} base - Base collection name (e.g., "users", "duties")
 * @param {string} envMode - Environment mode ("dev" or "prod")
 * @returns {string} Prefixed collection name (e.g., "dev_users", "prod_duties")
 * @throws {Error} If envMode is invalid
 */
export function prefixCollection(base, envMode) {
  if (!envMode || !["dev", "prod"].includes(envMode)) {
    throw new Error(`Invalid envMode: ${envMode}. Must be "dev" or "prod".`);
  }
  
  if (!base || typeof base !== "string") {
    throw new Error(`Invalid base collection name: ${base}`);
  }
  
  return `${envMode}_${base}`;
}

/**
 * Validate that a collection path has proper prefix
 * @param {string} path - Collection path to validate
 * @returns {boolean} True if path has valid dev_ or prod_ prefix
 */
export function hasValidPrefix(path) {
  if (!path || typeof path !== "string") {
    return false;
  }
  
  return /^(dev|prod)_.+/.test(path);
}

/**
 * Extract environment mode from prefixed collection name
 * @param {string} prefixedName - Prefixed collection name (e.g., "dev_users")
 * @returns {string|null} Environment mode ("dev" or "prod") or null if invalid
 */
export function extractEnvMode(prefixedName) {
  if (!hasValidPrefix(prefixedName)) {
    return null;
  }
  
  return prefixedName.split("_")[0];
}

/**
 * Extract base collection name from prefixed name
 * @param {string} prefixedName - Prefixed collection name (e.g., "dev_users")
 * @returns {string|null} Base collection name or null if invalid
 */
export function extractBaseName(prefixedName) {
  if (!hasValidPrefix(prefixedName)) {
    return null;
  }
  
  const parts = prefixedName.split("_");
  parts.shift(); // Remove prefix
  return parts.join("_");
}