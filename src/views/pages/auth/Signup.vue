
<script setup>
import router from '@/router';
import { registerAPI } from '@/service/Api';
import { computed, ref } from 'vue';

const step = ref(1)
const totalSteps = 5


const loading = ref(false)
const errorMessage = ref("")
const successMessage = ref("")


const form = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  store_name: '',
  store_address: '',
  store_phone: '',
  currency: '',
  business_type: '',
  plan: 'BASIC'
})


const validateStep = () => {
    errorMessage.value = "";

    if(step.value === 1){
        if(!form.value.username || !form.value.email){
            errorMessage.value = "Veuillez remplir tous les champs."
            return false;
        }
    }

    if(step.value === 2){
        if(!form.value.password || !form.value.confirmPassword){
            errorMessage.value = "Veuillez entrer le mot de passe.";
            return false;
        }
        if (form.value.password.length <5){
            errorMessage.value = "Le mot de passe doit contenir au moins 5 caractères.";
            return false;
        }

        if( form.value.password !== form.value.confirmPassword){
            errorMessage.value = "Les mots de passe ne correspondent pas.";
            return false;
        }

    }

    if(step.value === 3){
        if(!form.value.store_name || !form.value.store_phone || !form.value.store_address ){
            errorMessage.value = "Veuillez remplir tous les champs.";
            return false;
        }
    }
 
return true;

}

const register = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true
  const response  = await registerAPI(form.value);
  loading.value = false

  if(response.error){
     errorMessage.value = response.data?.detail || response.message
  }else{
    successMessage.value = "Compte créé avec succès ";
    router.push('/login')

  }
}



const nextStep = () => {
    if(validateStep()){
       if (step.value < 5) step.value++
    }
    
    }
const prevStep = () => {
  if (step.value > 1) step.value--
}

const progress = computed(() => (step.value - 1) / (totalSteps - 1) * 100)




</script>
<template>
<div class="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">

  <!-- Décorations fond -->
  <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
              bg-[#004D4A]/5 blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full
              bg-[#004D4A]/5 blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

  <!-- LAYOUT -->
  <div class="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 py-12">

    <!-- GAUCHE : IMAGE -->
    <div class="hidden lg:flex flex-col justify-center gap-8">

      <div class="relative rounded-3xl overflow-hidden
                  shadow-[0_16px_50px_rgba(0,77,74,0.12)]
                  border border-slate-100">
        <img
          src="/demo/modern.jpg"
          class="w-full h-[480px] object-cover"
          alt="BilaTech POS"
        />
        <!-- Overlay dégradé bas -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#004D4A]/60 via-transparent to-transparent"></div>

        <!-- Badge flottant -->
        <div class="absolute bottom-6 left-6 right-6">
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4
                      shadow-lg border border-white">
            <p class="text-[#004D4A] font-bold text-sm">Bila-Sol POS</p>
            <p class="text-slate-500 text-xs mt-0.5">Plateforme de gestion intelligente</p>
          </div>
        </div>
      </div>

      <!-- Texte sous image -->
      <div class="flex items-center gap-3 px-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
        <p class="text-slate-500 text-sm">
          Rejoignez plus de <span class="font-bold text-[#004D4A]">500+ entreprises</span> qui font confiance à BilaTech
        </p>
      </div>

    </div>

    <!-- DROITE : FORMULAIRE -->
    <div class="bg-white rounded-3xl border border-slate-100
                shadow-[0_8px_40px_rgba(0,77,74,0.08)]
                p-8 sm:p-10">

      <!-- HEADER -->
      <div class="text-center mb-8">
        <img
          src="/demo/bilatechslogan.png"
          class="h-12 mx-auto mb-4 object-contain"
          alt="BilaTech"
        />
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">
          Créer votre compte
        </h2>
        <p class="text-slate-500 text-sm mt-1">
          30 jours d'essai gratuit · Sans engagement
        </p>
      </div>

      <!-- PROGRESS BAR -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold text-[#004D4A]">Étape {{ step }} sur 5</span>
          <span class="text-xs text-slate-400">{{ progress }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full bg-[#004D4A] transition-all duration-500 ease-out"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- STEP INDICATORS -->
      <div class="flex justify-between mb-8">
        <div
          v-for="(label, index) in ['Infos', 'Sécurité', 'Boutique', 'Abonnement', 'Validation']"
          :key="index"
          class="flex flex-col items-center gap-1"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
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
            class="text-[10px] font-semibold hidden sm:block"
            :class="step >= index + 1 ? 'text-[#004D4A]' : 'text-slate-400'"
          >
            {{ label }}
          </span>
        </div>
      </div>

      <!-- STEP 1 : INFOS -->
      <div v-if="step === 1" class="space-y-4">
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-user text-xs text-[#004D4A]"></i>
            Nom d'utilisateur
          </label>
          <input v-model="form.username" placeholder="Entrez votre nom d'utilisateur" class="signup-input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="signup-field">
            <label class="signup-label">
              <i class="pi pi-id-card text-xs text-[#004D4A]"></i>
              Nom
            </label>
            <input v-model="form.first_name" placeholder="Nom" class="signup-input" />
          </div>
          <div class="signup-field">
            <label class="signup-label">
              <i class="pi pi-id-card text-xs text-[#004D4A]"></i>
              Post-nom
            </label>
            <input v-model="form.last_name" placeholder="Post-nom" class="signup-input" />
          </div>
        </div>
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-envelope text-xs text-[#004D4A]"></i>
            Email
          </label>
          <input v-model="form.email" type="email" placeholder="exemple@email.com" class="signup-input" />
        </div>

        <div v-if="errorMessage" class="signup-error">
          <i class="pi pi-exclamation-triangle text-xs flex-shrink-0"></i>
          {{ errorMessage }}
        </div>

        <button class="signup-btn-primary w-full" @click="nextStep">
          Continuer
          <i class="pi pi-arrow-right text-xs"></i>
        </button>
      </div>

      <!-- STEP 2 : SÉCURITÉ -->
      <div v-if="step === 2" class="space-y-4">
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-lock text-xs text-[#004D4A]"></i>
            Mot de passe
          </label>
          <input v-model="form.password" type="password" placeholder="Minimum 6 caractères" class="signup-input" />
        </div>
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-lock text-xs text-[#004D4A]"></i>
            Confirmer le mot de passe
          </label>
          <input v-model="form.confirmPassword" type="password" placeholder="Répétez votre mot de passe" class="signup-input" />
        </div>

        <div v-if="errorMessage" class="signup-error">
          <i class="pi pi-exclamation-triangle text-xs flex-shrink-0"></i>
          {{ errorMessage }}
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button class="signup-btn-secondary" @click="prevStep">
            <i class="pi pi-arrow-left text-xs"></i>
            Retour
          </button>
          <button class="signup-btn-primary" @click="nextStep">
            Continuer
            <i class="pi pi-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- STEP 3 : BOUTIQUE -->
      <div v-if="step === 3" class="space-y-4">
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-store text-xs text-[#004D4A]"></i>
            Nom du point de vente
          </label>
          <input v-model="form.store_name" placeholder="Ma boutique" class="signup-input" />
        </div>
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-map-marker text-xs text-[#004D4A]"></i>
            Adresse
          </label>
          <input v-model="form.store_address" placeholder="Adresse complète" class="signup-input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="signup-field">
            <label class="signup-label">
              <i class="pi pi-phone text-xs text-[#004D4A]"></i>
              Téléphone
            </label>
            <input v-model="form.store_phone" placeholder="+243 ..." class="signup-input" />
          </div>
          <div class="signup-field">
            <label class="signup-label">
              <i class="pi pi-wallet text-xs text-[#004D4A]"></i>
              Devise
            </label>
            <select v-model="form.currency" class="signup-input">
              <option value="">-- Devise --</option>
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div class="signup-field">
          <label class="signup-label">
            <i class="pi pi-briefcase text-xs text-[#004D4A]"></i>
            Type d'activité
          </label>
          <input v-model="form.business_type" placeholder="Commerce, Restauration..." class="signup-input" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button class="signup-btn-secondary" @click="prevStep">
            <i class="pi pi-arrow-left text-xs"></i>
            Retour
          </button>
          <button class="signup-btn-primary" @click="nextStep">
            Continuer
            <i class="pi pi-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- STEP 4 : ABONNEMENT -->
      <div v-if="step === 4" class="space-y-3">

        <div class="text-center mb-4">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-emerald-50 border border-emerald-200
                       text-emerald-700 text-xs font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            30 jours d'essai gratuit inclus
          </span>
        </div>

        <div
          v-for="plan in plans"
          :key="plan.value"
          @click="form.plan = plan.value"
          class="plan-card"
          :class="form.plan === plan.value ? 'plan-card--active' : ''"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center"
                :class="form.plan === plan.value ? 'bg-[#004D4A] text-white' : 'bg-slate-100 text-slate-500'"
              >
                <i :class="plan.icon" class="text-sm"></i>
              </div>
              <span class="font-bold text-sm text-slate-800">{{ plan.label }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold" :class="form.plan === plan.value ? 'text-[#004D4A]' : 'text-slate-600'">
                {{ plan.price }}
              </span>
              <div
                class="w-4 h-4 rounded-full border-2 transition-all"
                :class="form.plan === plan.value
                  ? 'border-[#004D4A] bg-[#004D4A]'
                  : 'border-slate-300'"
              >
                <i v-if="form.plan === plan.value" class="pi pi-check text-white text-[8px] flex items-center justify-center w-full h-full"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <button class="signup-btn-secondary" @click="prevStep">
            <i class="pi pi-arrow-left text-xs"></i>
            Retour
          </button>
          <button class="signup-btn-primary" @click="nextStep">
            Continuer
            <i class="pi pi-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- STEP 5 : VALIDATION -->
      <div v-if="step === 5" class="space-y-3">

        <div class="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
          <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <i class="pi pi-list text-[#004D4A] text-xs"></i>
            Récapitulatif
          </h4>

          <div class="recap-row">
            <span class="recap-label">Utilisateur</span>
            <span class="recap-value">{{ form.username }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-label">Email</span>
            <span class="recap-value">{{ form.email }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-label">Boutique</span>
            <span class="recap-value">{{ form.store_name }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-label">Devise</span>
            <span class="recap-value">{{ form.currency }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-label">Plan</span>
            <span class="recap-value font-bold text-[#004D4A]">{{ form.plan }}</span>
          </div>
        </div>

        <button
          class="signup-btn-primary w-full"
          :disabled="loading"
          @click="register"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
          <i v-else class="pi pi-check-circle text-sm"></i>
          {{ loading ? 'Création en cours...' : 'Créer le compte' }}
        </button>

        <button class="signup-btn-secondary w-full" @click="prevStep">
          <i class="pi pi-arrow-left text-xs"></i>
          Retour
        </button>

      </div>

    </div>
  </div>
</div>
</template>

<script> 
export default {
  data() {
    return {
      plans: [
        { value: 'BASIC',    label: 'BASIC',    price: '$9.99/mois',  icon: 'pi pi-star' },
        { value: 'MEDIUM',   label: 'MEDIUM',   price: '$19.99/mois', icon: 'pi pi-star-fill' },
        { value: 'PREMIUM',  label: 'PREMIUM',  price: '$39.99/mois', icon: 'pi pi-verified' },
        { value: 'PLATINUM', label: 'PLATINUM', price: '$59.99/mois', icon: 'pi pi-shield' },
        { value: 'DIAMOND',  label: 'DIAMOND',  price: '$79.99/mois', icon: 'pi pi-diamond' },
      ],
    };
  },
  methods: {
    planCard(active) {
      return [
        'cursor-pointer p-4 rounded-xl border transition-all',
        active
          ? 'bg-[#004D4A]/5 border-[#004D4A] shadow-sm'
          : 'bg-white border-slate-200 hover:border-[#004D4A]/40',
      ];
    },
  },
};

</script>

<style scoped>

.signup-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.signup-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.signup-input {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    outline: none;
    transition: all 0.2s ease;
}

.signup-input:focus {
    border-color: #004D4A;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
    background-color: #fff;
}

.signup-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
}

.signup-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 700;
    color: #fff;
    background-color: #004D4A;
    box-shadow: 0 4px 14px rgba(0, 77, 74, 0.25);
    transition: all 0.2s ease;
}

.signup-btn-primary:hover {
    background-color: #006660;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 77, 74, 0.3);
}

.signup-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.signup-btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    transition: all 0.2s ease;
}

.signup-btn-secondary:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}

.signup-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #dc2626;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
}

/* Plans */
.plan-card {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1.5px solid #e2e8f0;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
}

.plan-card:hover {
    border-color: rgba(0, 77, 74, 0.3);
    background-color: #f0faf9;
}

.plan-card--active {
    border-color: #004D4A;
    background-color: #f0faf9;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
}

/* Recap */
.recap-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
}

.recap-row:last-child {
    border-bottom: none;
}

.recap-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
}

.recap-value {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1e293b;
}
</style>