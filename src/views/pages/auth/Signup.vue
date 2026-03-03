
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
  currency: 'CDF',
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
        if (form.value.password.length < 6){
            errorMessage.value = "Le mot de passe doit contenir au moins 6 caractères.";
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
  <div class="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden text-gray-200">

    <!-- Background halos -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#7BB661]/30 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-80 h-80 bg-[#F9A825]/20 rounded-full blur-3xl"></div>

    <div class="relative w-full max-w-xl bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 p-8">

      <!-- TITLE -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] bg-clip-text text-transparent">Bilatech26</h1>
        <p class="text-gray-400">Créer votre compte</p>
      </div>

      <!-- ANIMATED PROGRESS BAR -->
      <div class="mb-8">
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#7BB661] to-[#004D4A] transition-all duration-500" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- STEP INDICATORS -->
      <div class="flex justify-between mb-8 text-xs">
        <span :class="step>=1?'text-green-400':'text-gray-500'">Infos</span>
        <span :class="step>=2?'text-green-400':'text-gray-500'">Sécurité</span>
        <span :class="step>=3?'text-green-400':'text-gray-500'">Boutique</span>
        <span :class="step>=4?'text-green-400':'text-gray-500'">Abonnement</span>
        <span :class="step>=5?'text-green-400':'text-gray-500'">Validation</span>
      </div>

      <!-- STEP 1 -->
      <div v-if="step===1" class="space-y-4">

        <input v-model="form.username" placeholder="Nom d'utilisateur" class="input" />
        <input v-model="form.first_name" placeholder="Nom" class="input" />
        <input v-model="form.last_name" placeholder="Post-nom" class="input" />
        <input v-model="form.email" type="email" placeholder="Email" class="input" />
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
        {{ errorMessage }}
        </p>

        <button class="btn-primary w-full" @click="nextStep">Continuer →</button>
      </div>

      <!-- STEP 2 -->
      <div v-if="step===2" class="space-y-4">
        <input v-model="form.password" type="password" placeholder="Mot de passe" class="input" />
        <input v-model="form.confirmPassword" type="password" placeholder="Confirmer mot de passe" class="input" />
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
        {{ errorMessage }}
        </p>
        <div class="flex gap-3">
          <button class="btn-secondary w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-primary w-1/2" @click="nextStep">Continuer →</button>
        </div>
      </div>

      <!-- STEP 3 -->
      <div v-if="step===3" class="space-y-4">
        <input v-model="form.store_name" placeholder="Nom du point de vente" class="input" />
        <input v-model="form.store_address" placeholder="Adresse" class="input" />
        <input v-model="form.store_phone" placeholder="Téléphone" class="input" />
        <select v-model="form.currency" class="input">
          <option value="CDF">Franc Congolais (CDF)</option>
          <option value="USD">Dollar Américain (USD)</option>
        </select>
        <input v-model="form.business_type" placeholder="Type d'activité" class="input" />
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
        {{ errorMessage }}
        </p>
        <div class="flex gap-3">
          <button class="btn-secondary w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-primary w-1/2" @click="nextStep">Continuer →</button>
        </div>
      </div>

      <!-- STEP 4 — SUBSCRIPTION CARDS -->
      <div v-if="step===4" class="space-y-4">

       <div class="plan-scroll">

            <h5 class="trial">Vous avez un essai gratuit de 10 Jours</h5>
            
            <!-- PRO -->
            <div @click="form.plan='BASIC'" :class="planCard(form.plan==='BASIC')">
                <h3 class="title">BASIC</h3>
                <p class="price">$9 / mois</p>
                <ul class="features">
                <li>✔ Gestion ventes</li>
                <li>✔ Stock</li>
                <li>✔ Rapports basiques</li>
                </ul>
            </div>

            <!-- BUSINESS -->
            <div @click="form.plan='MEDIUM'" :class="planCard(form.plan==='MEDIUM')">
                <h3 class="title">MEDIUM</h3>
                <p class="price">$19 / mois</p>
                <ul class="features">
                <li>✔ Multi-utilisateurs</li>
                <li>✔ Statistiques avancées</li>
                <li>✔ Support prioritaire</li>
                </ul>
            </div>

            <!-- PREMIUM -->
            <div @click="form.plan='PREMIUM'" :class="planCard(form.plan==='PREMIUM')">
                <h3 class="title">PREMIUM</h3>
                <p class="price">$29 / mois</p>
                <ul class="features">
                <li>✔ Tout BUSINESS</li>
                <li>✔ Cloud & Backup</li>
                <li>✔ Fonctionnalités POS avancées</li>
                </ul>
            </div>

        </div>

        <div class="flex gap-3">
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
        {{ errorMessage }}
        </p>
          <button class="btn-secondary w-1/2" @click="prevStep">← Retour</button>
          <button class="btn-primary w-1/2" @click="nextStep">Continuer →</button>
        </div>
      </div>

      <!-- STEP 5 — SUMMARY -->
      <div v-if="step===5" class="space-y-4 text-sm">
        <p><b>Utilisateur :</b> {{ form.username }}</p>
        <p><b>Email :</b> {{ form.email }}</p>
        <p><b>Boutique :</b> {{ form.store_name }}</p>
        <p><b>Devise :</b> {{ form.currency }}</p>
        <p><b>Abonnement :</b> {{ form.plan.toUpperCase() }}</p>

        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
        {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="text-green-400 text-sm mb-4">
        {{ successMessage }}
        </p>
        <div class="flex gap-3 pt-2">

          <button class="btn-secondary w-1/2" @click="prevStep">← Retour</button>
          <button 
            class="btn-primary w-1/2"
            :disabled="loading"
            @click="register"
            >
            {{ loading ? "Création..." : "Créer le compte" }}
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    planCard(active) {
      return [
        'cursor-pointer p-4 rounded-xl border transition-all',
        active
          ? 'bg-gradient-to-r from-[#7BB661]/20 to-[#004D4A]/20 border-[#7BB661] shadow-lg'
          : 'bg-gray-900 border-gray-700 hover:border-[#7BB661]'
      ]
    }
  }
}
</script>

<style scoped>
.input{
  width:100%;padding:12px;border-radius:10px;background:#020617;border:1px solid #374151;color:white
}
.btn-primary{
  padding:12px;border-radius:10px;font-weight:bold;background:linear-gradient(to right,#7BB661,#004D4A);color:white
}
.btn-secondary{
  padding:12px;border-radius:10px;font-weight:bold;background:#1f2937;color:#e5e7eb
}
.title{font-weight:700;font-size:18px; color: darkgoldenrod;}
.price{color:#7BB661;font-weight:600}
.features{font-size:13px;color:#cbd5e1;margin-top:6px}

.plan-scroll {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Texte essai gratuit */
.trial {
  text-align: center;
  color: #F9A825;
  font-weight: 600;
  margin-bottom: 6px;
}

/* Scrollbar style Bilatech26 */
.plan-scroll::-webkit-scrollbar {
  width: 6px;
}

.plan-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.plan-scroll::-webkit-scrollbar-thumb {
  background: #7BB661;
  border-radius: 6px;
}

.plan-scroll::-webkit-scrollbar-thumb:hover {
  background: #5da34c;
}
</style>
