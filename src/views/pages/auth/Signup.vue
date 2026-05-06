
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

<div class="min-h-screen flex items-center justify-center bg-[#070A12] px-4 relative overflow-hidden text-white">

  <!-- BACKGROUND (same pricing style) -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]"></div>

  <div class="absolute w-[500px] h-[500px] bg-[#7BB661]/20 blur-[120px] rounded-full"></div>
  <div class="absolute right-0 bottom-0 w-[400px] h-[400px] bg-[#F9A825]/20 blur-[120px] rounded-full"></div>

  <!-- SPLIT CARD -->
  <div class="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">

    <!-- 🖼️ LEFT IMAGE (NEW ONLY DESIGN) -->
    <div class="hidden lg:flex items-center justify-center">

      <div class="relative">

        <div class="absolute inset-0 bg-gradient-to-tr from-[#7BB661]/20 via-[#004D4A]/10 to-[#F9A825]/20 blur-3xl rounded-3xl"></div>

        <img
          src="/demo/modern.jpg"
          class="relative w-[420px] rounded-3xl
                 border border-white/10
                 shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
        />

      </div>

    </div>

    <!-- 🧊 RIGHT FORM (YOUR CODE PRESERVED) -->
    <div class="p-8 sm:p-10 rounded-3xl 
                bg-white/10 backdrop-blur-3xl 
                border border-white/20 
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]">

<!-- TITLE (iOS 26 PRO MAX) -->
    <div class="text-center mb-8 relative z-10">

      <!-- glow background subtil -->
      <div class="absolute inset-0 flex justify-center">
        <div class="w-40 h-40 bg-gradient-to-r from-[#7BB661]/20 via-[#004D4A]/20 to-[#F9A825]/20 blur-3xl rounded-full"></div>
      </div>

      <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] bg-clip-text text-transparent drop-shadow-lg">
        Bilatech26
      </h1>

      <p class="text-gray-300 mt-2 text-sm md:text-base font-light">
        Créer votre compte
      </p>
    </div>

    <!-- PROGRESS (iOS 26 GLASS BAR) -->
    <div class="mb-10 relative z-10">

      <!-- glass container -->
      <div class="h-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 overflow-hidden shadow-inner">

        <!-- animated glow line -->
        <div
          class="h-full rounded-full relative overflow-hidden transition-all duration-500"
          :style="{ width: progress + '%' }"
        >

          <!-- gradient main -->
          <div class="absolute inset-0 bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825]"></div>

          <!-- shine effect -->
          <div class="absolute inset-0 bg-white/20 blur-sm animate-pulse"></div>

        </div>
      </div>

      <!-- subtle reflection line -->
      <div class="mt-2 h-[1px] w-1/2 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>

      <!-- STEP INDICATORS (STYLE ONLY) -->
      <div class="flex justify-between mb-8 text-xs">
        <span :class="step>=1?'text-[#7BB661]':'text-gray-500'">Infos</span>
        <span :class="step>=2?'text-[#7BB661]':'text-gray-500'">Sécurité</span>
        <span :class="step>=3?'text-[#7BB661]':'text-gray-500'">Boutique</span>
        <span :class="step>=4?'text-[#7BB661]':'text-gray-500'">Abonnement</span>
        <span :class="step>=5?'text-[#7BB661]':'text-gray-500'">Validation</span>
      </div>

      <!-- STEP 1 (NO CHANGE LOGIC) -->
      <div v-if="step===1" class="space-y-4">

        <input v-model="form.username" placeholder="Nom d'utilisateur" class="input-ios" />
        <input v-model="form.first_name" placeholder="Nom" class="input-ios" />
        <input v-model="form.last_name" placeholder="Post-nom" class="input-ios" />
        <input v-model="form.email" type="email" placeholder="Email" class="input-ios" />

        <p v-if="errorMessage" class="text-red-400 text-sm">
          {{ errorMessage }}
        </p>

        <button class="btn-ios w-full" @click="nextStep">
          Continuer →
        </button>

      </div>

      <!-- STEP 2 -->
      <div v-if="step===2" class="space-y-4">

        <input v-model="form.password" type="password" placeholder="Mot de passe" class="input-ios" />
        <input v-model="form.confirmPassword" type="password" placeholder="Confirmer mot de passe" class="input-ios" />

        <p v-if="errorMessage" class="text-red-400 text-sm">
          {{ errorMessage }}
        </p>

        <div class="flex gap-3">
          <button class="btn-secondary-ios w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-ios w-1/2" @click="nextStep">Continuer</button>
        </div>

      </div>

      <!-- STEP 3 -->
      <div v-if="step===3" class="space-y-4">

        <input v-model="form.store_name" placeholder="Nom du point de vente" class="input-ios" />
        <input v-model="form.store_address" placeholder="Adresse" class="input-ios" />
        <input v-model="form.store_phone" placeholder="Téléphone" class="input-ios" />

        <select v-model="form.currency" class="input-ios">
          <option value="">-- Devise --</option>
          <option value="CDF">CDF</option>
          <option value="USD">USD</option>
        </select>

        <input v-model="form.business_type" placeholder="Type d'activité" class="input-ios" />

        <div class="flex gap-3">
          <button class="btn-secondary-ios w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-ios w-1/2" @click="nextStep">Continuer</button>
        </div>

      </div>

      <!-- STEP 4 -->
      <div v-if="step===4" class="space-y-3">

        <h5 class="text-center text-[#F9A825] font-semibold mb-2">
          Essai gratuit 30 jours
        </h5>

        <div @click="form.plan='BASIC'" class="plan-ios">BASIC - $9.99</div>
        <div @click="form.plan='MEDIUM'" class="plan-ios">MEDIUM - $19.99</div>
        <div @click="form.plan='PREMIUM'" class="plan-ios">PREMIUM - $29.99</div>
         <div @click="form.plan='PLATINUM'" class="plan-ios">PLATINUM - $29.99</div>
          <div @click="form.plan='DIAMOND'" class="plan-ios">DIAMOND - $59.99</div>

        <div class="flex gap-3 mt-4">
          <button class="btn-secondary-ios w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-ios w-1/2" @click="nextStep">Continuer</button>
        </div>

      </div>

      <!-- STEP 5 -->
      <div v-if="step===5" class="text-sm space-y-2 text-gray-300">

        <p><b>Utilisateur:</b> {{ form.username }}</p>
        <p><b>Email:</b> {{ form.email }}</p>
        <p><b>Boutique:</b> {{ form.store_name }}</p>
        <p><b>Devise:</b> {{ form.currency }}</p>
        <p><b>Plan:</b> {{ form.plan }}</p>

        <button class="btn-ios w-full mt-4" :disabled="loading" @click="register">
          {{ loading ? "Création..." : "Créer le compte" }}
        </button>

      </div>

    </div>

  </div>

</div>

</template>

<script> 
export default { methods:
   { planCard(active) { return [ 'cursor-pointer p-4 rounded-xl border transition-all', 
   active ? 'bg-gradient-to-r from-[#7BB661]/20 to-[#004D4A]/20 border-[#7BB661] shadow-lg' : 
   'bg-gray-900 border-gray-700 hover:border-[#7BB661]' ] } } } 
</script>


<style scoped>


.input-ios {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
}

.btn-ios {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  font-weight: 600;
}

.btn-secondary-ios {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: #ccc;
}

.plan-ios {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: 0.3s;
}

.plan-ios:hover {
  border-color: #7BB661;
}
</style>
