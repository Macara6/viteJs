

// src/utils/formatters.js

 export function formatPrice(value) {
  const number = Number(value || 0);

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(value) {
  if(value != null){
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const date = new Date(value);
    return date.toLocaleDateString('sv-SE', options).replace(' ', ' à ');
  }else{
    return "N/A"
  }
}


export  function formatDate (value ){
  if(value == null) return "N/A"

 return new Date(value).toLocaleString(
  'fr-FR', { year:'numeric', month:'2-digit', day:'2-digit' }
 );
}


export function formatLoyaltyCard(number){
  if (!number) return '';

  const cleanNumber = number.toString();
  if(cleanNumber.length !==6) return cleanNumber;
  return cleanNumber.slice(0, 3) + '-' + cleanNumber.slice(3);
}

export function statusCheck(is_blocked){
  return is_blocked ? "BLOCKED" : "ACTIF";
}

export function checkSubMod(is_free){
  return is_free ? "GRATUIT" : "PAIYANT";
}

export function checkInvoice(status){
  if(status == "paid")return "PAYÉ"
  if(status == "unpaid") return "EN ATTENTE"

  return "INCONNU";
}
export function invoiceSeverity(status){
  if(status =="paid") return "success";
  if(status =="unpaid") return "warn";

  return "secondary";
}

