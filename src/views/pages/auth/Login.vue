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

<div class="min-h-screen flex items-center justify-center bg-[#070A12] px-4 overflow-hidden relative">

  <!-- BACKGROUND GLOW (comme pricing) -->
  <div class="absolute inset-0 
              bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]">
  </div>

  <!-- FLOATING LIGHTS -->
  <div class="absolute w-[400px] h-[400px] bg-[#7BB661]/20 blur-[120px] rounded-full animate-float1"></div>
  <div class="absolute right-0 bottom-0 w-[400px] h-[400px] bg-[#F9A825]/20 blur-[120px] rounded-full animate-float2"></div>

  <!-- CARD -->
  <div class="relative w-full max-w-md z-10">

    <div class="p-8 sm:p-10 rounded-3xl 
                bg-white/10 backdrop-blur-3xl 
                border border-white/20 
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]
                transition-all duration-500">

      <!-- LOGO -->
      <div class="text-center mb-6">

        <img src="/demo/bilatechblanc.png"
             class="h-20 mx-auto mb-3 
                    drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />

        <h2 class="text-2xl font-semibold text-white tracking-tight">
          Connexion
        </h2>

        <p class="text-gray-400 text-sm mt-1">
          Accédez à votre espace BilaTech
        </p>

      </div>

      <!-- ERROR -->
      <div v-if="errorMessage"
           class="text-red-400 text-center mb-4 text-sm">
        {{ errorMessage }}
      </div>

      <!-- FORM -->
      <div class="space-y-5">

        <!-- USERNAME -->
        <div>
          <label class="text-gray-300 text-sm mb-1 block">
            Nom d’utilisateur
          </label>

          <InputText
            v-model="username"
            placeholder="Nom d’utilisateur"
            class="input-ios"
          />
        </div>

        <!-- PASSWORD -->
        <div>
          <label class="text-gray-300 text-sm mb-1 block">
            Mot de passe
          </label>

          <Password
            v-model="password"
            :toggleMask="true"
            :feedback="false"
            placeholder="mot de passe"
            class="input-ios"
            inputClass="w-full h-12 text-white bg-transparent border-none outline-none"
          />

        </div>

        <!-- REMEMBER -->
        <div class="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" v-model="rememberMe" />
          Se souvenir de moi
        </div>

        <!-- BUTTON -->
        <button
          @click="handleLogin"
          :disabled="loading"
          class="
            w-full py-3 rounded-2xl 
            bg-white/10 backdrop-blur-xl 
            border border-white/20
            text-white font-medium
            flex justify-center items-center gap-2
            transition-all duration-300
            hover:bg-white/20 hover:scale-[1.02]
            active:scale-[0.97]
          "
        >
          <i v-if="loading" class="pi pi-spin pi-spinner"></i>
          <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
        </button>

        <!-- LINKS -->
        <div class="text-center text-sm text-gray-400 space-y-2 mt-4">

          <RouterLink to="/reset" class="link-ios">
            Mot de passe oublié ?
          </RouterLink>

          <RouterLink to="/signup" class="link-ios block">
            Créer un compte
          </RouterLink>

          <RouterLink to="/Payment" class="link-ios block">
            Réabonnement
          </RouterLink>

        </div>

        <!-- FOOT -->
        <p class="text-center text-xs text-gray-500 mt-6">
          © 2026 BilaTech
        </p>

      </div>

    </div>

  </div>

</div>

</template>

<style scoped>

/* INPUT */
.input-ios {
  @apply w-full rounded-xl 
         bg-white/5 backdrop-blur-xl 
         border border-white/10 
         text-white placeholder-gray-400
         focus:border-[#7BB661] focus:ring-1 focus:ring-[#7BB661]
         transition-all duration-300;
}

 .p-password .p-inputtext {
  background: transparent !important;
  color: white !important;
}

 .p-password,
.p-password input {
  background: transparent !important;
  color: white !important;
  border: none !important;
  box-shadow: none !important;
}

  /* LINKS */
  .link-ios {
    @apply text-[#7BB661] hover:text-white transition;
  }

  /* FLOAT ANIMATIONS */
  @keyframes float1 {
    0%,100% { transform: translate(0,0); }
    50% { transform: translate(20px, -20px); }
  }

  @keyframes float2 {
    0%,100% { transform: translate(0,0); }
    50% { transform: translate(-20px, 20px); }
  }

  .animate-float1 {
    animation: float1 12s ease-in-out infinite;
  }

  .animate-float2 {
    animation: float2 14s ease-in-out infinite;
  }

</style>
