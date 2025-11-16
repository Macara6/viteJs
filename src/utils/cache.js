// src/utils/cache.js

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

const cacheKey = (name) => `cache_${name}`;

/**
 * Sauvegarde des données en cache
 * @param {string} name - clé du cache
 * @param {any} data - données à stocker
 */
export const saveCache = (name, data) => {
  localStorage.setItem(
    cacheKey(name),
    JSON.stringify({ data, timestamp: Date.now() })
  );
};

/**
 * Charge les données depuis le cache
 * @param {string} name - clé du cache
 * @returns {any|null} données si disponibles et pas expirées, sinon null
 */
export const loadCache = (name) => {
  const cached = localStorage.getItem(cacheKey(name));
  if (!cached) return null;

  try {
    const payload = JSON.parse(cached);
    if (Date.now() - payload.timestamp < CACHE_EXPIRATION_MS) return payload.data;
    localStorage.removeItem(cacheKey(name)); // supprime si expiré
    return null;
  } catch {
    return null;
  }
};

/**
 * Supprime un cache spécifique
 */
export const clearCache = (name) => {
  localStorage.removeItem(cacheKey(name));
};

/**
 * Supprime tous les caches
 */
export const clearAllCache = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('cache_'))
    .forEach(key => localStorage.removeItem(key));
};

