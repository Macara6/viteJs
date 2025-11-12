

// src/utils/formatters.js
export function formatPrice(value) {
  if (value == null) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export  function formatDate (value ){
  if(value == null) return "N/A"

 return new Date(value).toLocaleString(
  'fr-FR', { year:'numeric', month:'2-digit', day:'2-digit' 

  });
}