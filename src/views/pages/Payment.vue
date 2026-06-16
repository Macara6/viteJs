<script setup>
import { fetchSubscriptionByEmail, paySubscription } from "@/service/Api";
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from "vue";
import { useRouter } from 'vue-router';
const toast = useToast()
const step = ref(1)
const email = ref("")
const subscription = ref(null)
const paymentMethod = ref(null)
const loading = ref(false)
const phone = ref("")

const cardNumber = ref("")
const cardName = ref("")
const cardExpiry = ref("")
const cardCvv = ref("")
const cardProvider = ref("");
const localProvider = ref("");

const errorMessage = ref("");
const successMessage = ref("");

const paymentLoading = ref(false)

const router = useRouter();
const isCardPayment = computed(()=>{
  return paymentMethod.value === "visa"
})



function formatExpiry(e){
  let value = e.target.value.replace(/\D/g, "");
  if(value.length >= 3){
    value = value.slice(0, 2) + "/" + value.slice(2, 4);

  }
  cardExpiry.value = value.slice(0, 5);
}

const detectCardProvider = (number) => {

  const clean = number.replace(/\D/g, "")
  if(/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6][0-9]|7[01]|720))/.test(clean)) return "mastercard"

  return "";

}

const detectLocalProvider = (brand, digits) => {
  if(!brand) return "";

  const first = digits.slice(0, 4)
  if(brand === "visa"){
    
    if (["4585","0200"].includes(first)) return "Mpesa" 
  }
  return "";

} 
const formatCardNumber = (value) =>{
  return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
}

watch(cardNumber, (val) => {
  cardProvider.value = detectCardProvider(val)
  cardNumber.value = formatCardNumber(val)
  localProvider.value = detectLocalProvider(cardProvider.value, val)
  
})

const getSubscription = async () => {

  if(!email.value){
    errorMessage.value = "Veuillez entrer votre email"
    return
  }

  try{
    loading.value = true
    const response = await fetchSubscriptionByEmail(email.value)
    subscription.value = response
    errorMessage.value ="";
    step.value = 2

  }catch(error){
    errorMessage.value = "Utilisateur non trouvé"
  }finally{
    loading.value = false
  }
}

const choosePayment = (method)=>{
  paymentMethod.value = method
}




const confirmPayment = async ()=>{

  if(!paymentMethod.value){
    errorMessage.value = "Choisissez un moyen de paiement"
    return
  }

  try{
     paymentLoading.value = true;

     const data = {
      phone: "+243" + phone.value,
      amount: subscription.value.amount,
      provider: paymentMethod.value,
      email:email.value,
      
      cardNumber: cardNumber.value,
      cardName: cardName.value,
      cardExpiry: cardExpiry.value,
      cardCvv: cardCvv.value
    }

    const response = await paySubscription(data);
    
    if (response.status === 200) {

      successMessage.value = "Inscription réussie ! Redirection...";

      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }
    
  }catch(error){
    console.log(error)
    let backendError =
    error.response?.data?.errors?.message ||
    error.response?.data.message ||
    "Paiement échoué. Réessayez.";
    errorMessage.value = backendError;
    alert("Erreur paiement")
  }finally{
     
     paymentLoading.value = false
  }

  
}


</script>

<template>
<div class="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden py-12">

  <!-- Décorations fond -->
  <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
              bg-[#004D4A]/5 blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full
              bg-[#004D4A]/5 blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

  <!-- CARD -->
  <div class="relative z-10 w-full max-w-lg">
    <div class="bg-white rounded-3xl border border-slate-100
                shadow-[0_8px_40px_rgba(0,77,74,0.10)] p-8 sm:p-10">

      <!-- HEADER -->
      <div class="text-center mb-8">
        <img
          src="/demo/bilatechslogan.png"
          class="h-12 mx-auto mb-4 object-contain"
          alt="BilaTech"
        />
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">
          Renouvellement
        </h2>
        <p class="text-slate-500 text-sm mt-1">
          Renouvelez votre abonnement BilaTech
        </p>
      </div>

      <!-- MESSAGES -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="successMessage"
             class="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5
                    bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <i class="pi pi-check-circle text-emerald-500 flex-shrink-0"></i>
          {{ successMessage }}
        </div>
      </Transition>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="errorMessage"
             class="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5
                    bg-red-50 border border-red-200 text-red-600 text-sm">
          <i class="pi pi-exclamation-triangle text-red-500 flex-shrink-0"></i>
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- PROGRESS BAR -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold text-[#004D4A]">Étape {{ step }} sur 3</span>
          <span class="text-xs text-slate-400">{{ step * 33 }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full bg-[#004D4A] transition-all duration-500 ease-out"
            :style="{ width: step * 33 + '%' }"
          ></div>
        </div>
      </div>

      <!-- STEP INDICATORS -->
      <div class="flex justify-between mb-8">
        <div
          v-for="(label, index) in ['Email', 'Abonnement', 'Paiement']"
          :key="index"
          class="flex flex-col items-center gap-1"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            :class="step > index + 1
              ? 'bg-[#004D4A] text-white'
              : step === index + 1
              ? 'bg-[#004D4A] text-white ring-4 ring-[#004D4A]/20'
              : 'bg-slate-100 text-slate-400'"
          >
            <i v-if="step > index + 1" class="pi pi-check text-[10px]"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            class="text-[10px] font-semibold"
            :class="step >= index + 1 ? 'text-[#004D4A]' : 'text-slate-400'"
          >
            {{ label }}
          </span>
        </div>
      </div>

      <!-- ── STEP 1 : EMAIL ── -->
      <div v-if="step === 1" class="space-y-4">

        <div class="renew-field">
          <label class="renew-label">
            <i class="pi pi-envelope text-xs text-[#004D4A]"></i>
            Adresse email
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="exemple@email.com"
            class="renew-input"
          />
        </div>

        <button
          class="renew-btn-primary w-full"
          @click="getSubscription"
          :disabled="loading"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
          <i v-else class="pi pi-search text-sm"></i>
          {{ loading ? 'Chargement...' : 'Vérifier l\'abonnement' }}
        </button>

      </div>

      <!-- ── STEP 2 : ABONNEMENT ── -->
      <div v-if="step === 2 && subscription" class="space-y-4">

        <div class="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">

          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Détails de l'abonnement
          </h4>

          <div class="recap-row">
            <span class="recap-label">Plan</span>
            <span class="recap-value text-[#004D4A] font-bold">
              {{ subscription.subscription_type }}
            </span>
          </div>

          <div class="recap-row">
            <span class="recap-label">Montant</span>
            <span class="recap-value font-bold">
              ${{ subscription.amount }}
            </span>
          </div>

          <div class="recap-row border-0">
            <span class="recap-label">Expiration</span>
            <span class="recap-value" :class="isExpiringSoon ? 'text-red-500' : 'text-slate-700'">
              {{ subscription.end_date }}
            </span>
          </div>

        </div>

        <div class="grid grid-cols-2 gap-3">
          <button class="renew-btn-secondary" @click="step = 1">
            <i class="pi pi-arrow-left text-xs"></i>
            Retour
          </button>
          <button class="renew-btn-primary" @click="step = 3">
            Continuer
            <i class="pi pi-arrow-right text-xs"></i>
          </button>
        </div>

      </div>

      <!-- ── STEP 3 : PAIEMENT ── -->
      <div v-if="step === 3" class="space-y-5">

        <p class="text-xs font-bold text-slate-500 uppercase tracking-wide text-center">
          Choisissez un moyen de paiement
        </p>

        <!-- MÉTHODES DE PAIEMENT -->
        <div class="grid grid-cols-2 gap-3">

          <button
            @click="choosePayment('visa')"
            class="payment-method-card"
            :class="paymentMethod === 'visa' ? 'payment-method-card--active' : ''"
          >
            <img
              src="https://www.reussir-mon-ecommerce.fr/wp-content/uploads/2016/03/ancien-logo-visa-1-1024x389.png"
              class="h-7 mx-auto object-contain"
              alt="Visa"
            />
            <p class="text-xs font-semibold text-slate-600 mt-2">Carte bancaire</p>
          </button>

          <button
            @click="choosePayment('mpesa')"
            class="payment-method-card"
            :class="paymentMethod === 'mpesa' ? 'payment-method-card--active' : ''"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/03/M-pesa-logo.png"
              class="h-7 mx-auto object-contain"
              alt="M-Pesa"
            />
            <p class="text-xs font-semibold text-slate-600 mt-2">M-Pesa</p>
          </button>

          <button
            @click="choosePayment('airtel')"
            class="payment-method-card"
            :class="paymentMethod === 'airtel' ? 'payment-method-card--active' : ''"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Airtel_logo-01.png"
              class="h-7 mx-auto object-contain"
              alt="Airtel"
            />
            <p class="text-xs font-semibold text-slate-600 mt-2">Airtel Money</p>
          </button>

          <button
            @click="choosePayment('orange')"
            class="payment-method-card"
            :class="paymentMethod === 'orange' ? 'payment-method-card--active' : ''"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg"
              class="h-7 mx-auto object-contain"
              alt="Orange"
            />
            <p class="text-xs font-semibold text-slate-600 mt-2">Orange Money</p>
          </button>

        </div>

        <!-- FORMULAIRE MOBILE MONEY -->
        <div
          v-if="['mpesa', 'airtel', 'orange'].includes(paymentMethod)"
          class="space-y-3"
        >
          <div class="renew-field">
            <label class="renew-label">
              <i class="pi pi-phone text-xs text-[#004D4A]"></i>
              Numéro de téléphone
            </label>
            <div class="renew-input flex items-center gap-2 !py-0 !pr-0">
              <span class="text-sm font-bold text-[#004D4A] flex-shrink-0">+243</span>
              <div class="w-px h-5 bg-slate-200"></div>
              <input
                v-model="phone"
                class="flex-1 outline-none text-slate-800 text-sm placeholder-slate-400 py-3"
                placeholder="812 345 678"
                maxlength="9"
                inputmode="numeric"
              />
            </div>
            <p class="text-xs text-slate-400 mt-1">
              9 chiffres uniquement, sans l'indicatif (+243)
            </p>
          </div>
        </div>

        <!-- FORMULAIRE CARTE BANCAIRE -->
        <div v-if="paymentMethod === 'visa'" class="space-y-3">

          <div class="renew-field">
            <label class="renew-label">
              <i class="pi pi-user text-xs text-[#004D4A]"></i>
              Nom sur la carte
            </label>
            <input
              v-model="cardName"
              placeholder="Jean Dupont"
              class="renew-input"
            />
          </div>

          <div class="renew-field">
            <label class="renew-label">
              <i class="pi pi-credit-card text-xs text-[#004D4A]"></i>
              Numéro de carte
            </label>
            <div class="renew-input flex items-center gap-2 !py-0 !pr-3">
              <input
                v-model="cardNumber"
                class="flex-1 outline-none text-slate-800 text-sm placeholder-slate-400 py-3"
                placeholder="0000 0000 0000 0000"
              />
              <div v-if="cardProvider" class="text-xs font-bold text-blue-600 flex-shrink-0">
                {{ cardProvider }}
              </div>
              <div v-if="localProvider" class="text-xs font-semibold text-emerald-600 flex-shrink-0">
                {{ localProvider }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="renew-field">
              <label class="renew-label">
                <i class="pi pi-calendar text-xs text-[#004D4A]"></i>
                Expiration
              </label>
              <input
                v-model="cardExpiry"
                @input="formatExpiry"
                placeholder="MM/YY"
                class="renew-input"
                maxlength="5"
              />
            </div>
            <div class="renew-field">
              <label class="renew-label">
                <i class="pi pi-lock text-xs text-[#004D4A]"></i>
                CVV
              </label>
              <input
                v-model="cardCvv"
                placeholder="•••"
                class="renew-input"
              />
            </div>
          </div>

        </div>

        <!-- BOUTON PAYER -->
        <button
          class="renew-btn-primary w-full"
          @click="confirmPayment"
          :disabled="paymentLoading"
        >
          <i v-if="paymentLoading" class="pi pi-spin pi-spinner text-sm"></i>
          <i v-else class="pi pi-credit-card text-sm"></i>
          {{ paymentLoading ? 'Traitement...' : `Payer $${subscription?.amount}` }}
        </button>

        <button class="renew-btn-secondary w-full" @click="step = 2">
          <i class="pi pi-arrow-left text-xs"></i>
          Retour
        </button>

      </div>

    </div>
  </div>

</div>
</template>

<style scoped>

.renew-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.renew-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.renew-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    outline: none;
    transition: all 0.2s ease;
}

.renew-input:focus,
.renew-input:focus-within {
    border-color: #004D4A;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
    background-color: #fff;
}

.renew-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
}

.renew-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 700;
    color: #fff;
    background-color: #004D4A;
    box-shadow: 0 4px 14px rgba(0, 77, 74, 0.25);
    transition: all 0.2s ease;
}

.renew-btn-primary:hover {
    background-color: #006660;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 77, 74, 0.3);
}

.renew-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.renew-btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    transition: all 0.2s ease;
}

.renew-btn-secondary:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}

/* Cartes de paiement */
.payment-method-card {
    padding: 1rem;
    border-radius: 14px;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.payment-method-card:hover {
    border-color: rgba(0, 77, 74, 0.3);
    background-color: #f0faf9;
}

.payment-method-card--active {
    border-color: #004D4A;
    background-color: #f0faf9;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
}

/* Récap */
.recap-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
}

.recap-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
}

.recap-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
}
</style>