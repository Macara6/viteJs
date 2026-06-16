<script setup>

import { fecthSubscriptionByUserId, login } from '@/service/Api';

import { useGlobalAlert } from '@/layout/composables/useGlobalAlert';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const rememberMe = ref(false);


const { showAlert } = useGlobalAlert()

const handleLogin = async() => {
    errorMessage.value = '';

    if(!username.value || !password.value){
        errorMessage.value='Please enter both username and password';
        return;
    }

    loading.value = true; 
    
    try {

       const userData = await login(username.value, password.value, rememberMe.value); 

       if (userData && userData.token){
          let subscription = null;
            try{
              subscription = await fecthSubscriptionByUserId(userData.id)

              if( subscription && subscription.end_date){
                const today = new  Date();
                const endDate = new Date(subscription.end_date);
                const diffTime = endDate - today
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if(subscription.is_free_frial){
                  if(daysRemaining > 0 && daysRemaining <= 10){
                    showAlert(`⚠️ Votre période d'essai expire dans ${daysRemaining} jour(s)`, "warning")
                  }
                }
                if(daysRemaining <= 5 && daysRemaining > 0){
                  showAlert(`⚠️ Votre abonnement expire dans ${daysRemaining} jour(s)`, "warning")
                }
                if(daysRemaining <= 0){
                   showAlert(" Votre abonnement est expiré. Veuillez renouveler.", "danger")
                   router.push('/Payment')
                   return
                }
                
              }
            }catch(error){
              console.log('Aucun abonnement trouvé pour cet utilisateur');
            }
            if(subscription && subscription.subscription_type ==='BASIC'){
            errorMessage.value = "Votre abonnement BASIC ne permet pas l'accès à cette application";
            return;
           }

          if(userData.is_superuser){
            router.push('/pages/Utilisateur');
            return;
          }
          console.log('userData', userData);
         switch(userData.status){
            case 'ADMIN':
                router.push('/pages/Bilan');
              break;
            case 'CAISSIER':
              router.push('/pages/vente');
             break;

            case 'GESTIONNAIRE_STOCK':
              router.push('/pages/Produit');
              break;

            default:
                errorMessage.value = "Impossible de déterminer la page d'accueil.";
         }

       }else{
        throw new Error('Login failed: No user data returned');
       }
        
    } catch (error) {
        console.error('Login failed:', error);
        
        if (error.response && error.response.status === 401){
            errorMessage.value = "compte non trouvé";

        } else if(error.response && error.response.status ===400) {
            errorMessage.value = 'Aucun abonnement trouver pour cette utilisateur';
        } else if(error.response && error.response.status === 406) {
          errorMessage.value = "Ce compte est bloqué pour un moment";
        } else{
          errorMessage.value = "compte non trouvé";
        }

    } finally{
        loading.value = false;
    }
  
}



</script>


<template>
<div class="min-h-screen flex items-center justify-center bg-white px-4 overflow-hidden relative">

  <!-- Décorations fond -->
  <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
              bg-[#004D4A]/5 blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full
              bg-[#004D4A]/5 blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

  <!-- CARD -->
  <div class="relative w-full max-w-md z-10">
    <div class="bg-white rounded-3xl border border-slate-100
                shadow-[0_8px_40px_rgba(0,77,74,0.10)]
                p-8 sm:p-10">

      <!-- LOGO + TITRE -->
      <div class="text-center mb-8">
        <img
          src="/demo/bilatechslogan.png"
          class="h-14 mx-auto mb-5 object-contain"
          alt="BilaTech"
        />

        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">
          Connexion
        </h2>
        <p class="text-slate-500 text-sm mt-1.5">
          Accédez à votre espace BilaTech
        </p>
      </div>

      <!-- ERROR -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="errorMessage"
          class="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5
                 bg-red-50 border border-red-200 text-red-600 text-sm"
        >
          <i class="pi pi-exclamation-triangle text-red-500 flex-shrink-0"></i>
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- FORM -->
      <div class="space-y-4">

        <!-- USERNAME -->
        <div class="form-group">
          <label class="form-label">
            <i class="pi pi-user text-xs text-[#004D4A]"></i>
            Nom d'utilisateur
          </label>
          <InputText
            v-model="username"
            placeholder="Entrez votre nom d'utilisateur"
            class="login-input"
          />
        </div>

        <!-- PASSWORD -->
        <div class="form-group">
          <label class="form-label">
            <i class="pi pi-lock text-xs text-[#004D4A]"></i>
            Mot de passe
          </label>
          <Password
            v-model="password"
            :toggleMask="true"
            :feedback="false"
            placeholder="Entrez votre mot de passe"
            class="login-input w-full"
            inputClass="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <!-- REMEMBER ME -->
        <div class="flex items-center gap-2.5 py-1">
          <input
            type="checkbox"
            v-model="rememberMe"
            id="rememberMe"
            class="w-4 h-4 rounded accent-[#004D4A] cursor-pointer"
          />
          <label for="rememberMe" class="text-sm text-slate-500 cursor-pointer select-none">
            Se souvenir de moi
          </label>
        </div>

        <!-- BOUTON CONNEXION -->
        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2.5
                 py-3.5 rounded-2xl
                 bg-[#004D4A] hover:bg-[#006660]
                 text-white text-sm font-bold
                 shadow-lg shadow-[#004D4A]/20
                 hover:shadow-[#004D4A]/30
                 hover:scale-[1.02] active:scale-[0.98]
                 transition-all duration-200
                 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
          <i v-else class="pi pi-sign-in text-sm"></i>
          <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
        </button>

        <!-- DIVIDER -->
        <div class="flex items-center gap-3 py-2">
          <div class="flex-1 h-px bg-slate-100"></div>
          <span class="text-xs text-slate-400 font-medium">ou</span>
          <div class="flex-1 h-px bg-slate-100"></div>
        </div>

        <!-- LIENS -->
        <div class="flex flex-col gap-2">

          <RouterLink
            to="/reset"
            class="login-link-btn"
          >
            <i class="pi pi-key text-xs"></i>
            Mot de passe oublié ?
          </RouterLink>

          <RouterLink
            to="/signup"
            class="login-link-btn"
          >
            <i class="pi pi-user-plus text-xs"></i>
            Créer un compte
          </RouterLink>

          <RouterLink
            to="/Payment"
            class="login-link-btn"
          >
            <i class="pi pi-refresh text-xs"></i>
            Réabonnement
          </RouterLink>

        </div>

      </div>

      <!-- FOOTER -->
      <p class="text-center text-xs text-slate-400 mt-8 pt-6 border-t border-slate-100">
        © 2026 BilaTech — Tous droits réservés
      </p>

    </div>
  </div>

</div>
</template>

<style scoped>

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.login-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.login-input:focus,
.login-input:focus-within {
    border-color: #004D4A;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
    background-color: #fff;
}

:deep(.p-password) {
    width: 100%;
}

:deep(.p-password input) {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    outline: none;
    transition: all 0.2s ease;
}

:deep(.p-password input:focus) {
    border-color: #004D4A;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
    background-color: #fff;
}

:deep(.p-password .p-icon-field) {
    width: 100%;
}

.login-link-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: 14px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #004D4A;
    background-color: #f0faf9;
    border: 1.5px solid rgba(0, 77, 74, 0.1);
    transition: all 0.2s ease;
    text-decoration: none;
}

.login-link-btn:hover {
    background-color: #004D4A;
    color: #fff;
    border-color: #004D4A;
    transform: translateY(-1px);
}
</style>
