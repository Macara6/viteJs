<script setup>

import { fecthSubscriptionByUserId, login } from '@/service/Api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleLogin = async() => {
    errorMessage.value = '';

    if(!username.value || !password.value){
        errorMessage.value='Please enter both username and password';
        return;
    }

    loading.value = true; 

    
    try {

       const userData = await login(username.value, password.value); 

       if (userData && userData.token){
          let subscription = null;
            try{
              subscription = await fecthSubscriptionByUserId(userData.id)
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
        } else(
            errorMessage.value = 'Compte nom trouvee'
        )

    } finally{
        loading.value = false;
    }
  
}



</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8">
    
    <!-- Card connexion -->
    <div class="w-full max-w-md bg-gray-900 dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
      
      <!-- Halo subtil derrière le card -->
      <div class="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-tr from-[#7BB661]/40 via-[#004D4A]/30 to-[#F9A825]/20 rounded-full blur-3xl animate-pulse-slow"></div>

      <div class="text-center mb-8 relative z-10">
        <img src="/demo/bilatechblanc.png" alt="Logo BilaTech" class="h-32 sm:h-40 mx-auto mb-4" />
         
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#7BB661]">Connexion</h2>
        <p class="text-gray-300 text-sm sm:text-base">Connectez-vous à votre compte</p>
      </div>

      <div v-if="errorMessage" class="text-red-500 text-center mb-4 text-sm sm:text-base relative z-10">
        {{ errorMessage }}
      </div>

      <div class="space-y-6 relative z-10">
        <!-- Nom d’utilisateur -->
        <div>
          <label for="username" class="block text-gray-200 text-sm font-medium mb-2">
            Nom d’utilisateur
          </label>
          <InputText
            id="username"
            v-model="username"
            placeholder="Nom d’utilisateur"
            class="w-full h-12 text-base rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-[#7BB661] focus:ring-1 focus:ring-[#7BB661] transition-all"
          />
        </div>

        <!-- Mot de passe -->
        <div>
          <label for="password" class="block text-gray-200 text-sm font-medium mb-2">
            Mot de passe
          </label>
          <Password
            id="password"
            v-model="password"
            placeholder="Mot de passe"
            :toggleMask="true"
            class="custom-password w-full rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-[#7BB661] focus:ring-1 focus:ring-[#7BB661] transition-all"
            inputClass="w-full h-12 text-base"
            :feedback="false"
          />
        </div>

        <!-- Bouton -->
        <Button
          label="Se connecter"
          class="w-full py-3 text-base font-semibold rounded-xl flex justify-center items-center gap-2 bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-transform duration-300"
          @click="handleLogin"
          :disabled="loading"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-white"></i>
          <span v-else>Se connecter</span>
        </Button>

        <div class="text-center mt-4">
          <RouterLink to="/reset" class="text-sm text-[#7BB661] hover:underline transition-colors">
            Mot de passe oublié ?
          </RouterLink>
        </div>
        <h3 class="text-center 2xl sm:text-3xl font-extrabold text-[#7BB661]">2026</h3>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ajuste la taille du champ mot de passe pour correspondre au champ texte */
.custom-password :deep(input) {
  height: 3rem !important;
  width: 100% !important;
  font-size: 1rem;
  border-radius: 0.75rem;
}

/* Ajustement icônes œil */
.pi-eye,
.pi-eye-slash {
  transform: scale(1.3);
  margin-right: 0.75rem;
}

/* Responsive: petits écrans */
@media (max-width: 640px) {
  .p-inputtext,
  .p-password-input {
    font-size: 0.9rem !important;
  }

  .p-button {
    font-size: 0.95rem !important;
    padding: 0.75rem !important;
  }
}
</style>
