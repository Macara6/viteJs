

// src/utils/formatters.js
export function formatPrice(value) {
  if (value == null) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
