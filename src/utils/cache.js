

// src/utils/cache.js
export const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 min

export const cacheKey = (name) => `cache_${name}`;

export const saveCache = (name, data) => {
  localStorage.setItem(cacheKey(name), JSON.stringify({ data, timestamp: Date.now() }));
};

export const loadCache = (name) => {
  const cached = localStorage.getItem(cacheKey(name));
  if (!cached) return null;
  try {
    const payload = JSON.parse(cached);
    if (Date.now() - payload.timestamp < CACHE_EXPIRATION_MS) return payload.data;
    localStorage.removeItem(cacheKey(name));
    return null;
  } catch {
    return null;
  }
};
