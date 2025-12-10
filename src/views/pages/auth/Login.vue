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
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-10">

        <div class="text-center mb-8">
        <img src="/demo/bilatechslogan.png" alt="Logo BilaTech" class="h-30 sm:h-40 mx-auto mb-2" />
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Connexion</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Connectez-vous à votre compte</p>
        </div>


      <div v-if="errorMessage" class="text-red-500 text-center mb-4 text-sm sm:text-base">
        {{ errorMessage }}
      </div>

      <div class="space-y-6">
        <!-- Champ Nom d'utilisateur -->
        <div>
          <label for="username" class="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
            Nom d’utilisateur
          </label>
          <InputText
            id="username"
            v-model="username"
            placeholder="Nom d’utilisateur"
            class="w-full h-12 text-base"
          />
        </div>

        <!-- Champ Mot de passe -->
        <div>
          <label for="password" class="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
            Mot de passe
          </label>
          <div class="w-full">
            <Password
              id="password"
              v-model="password"
              placeholder="Mot de passe"
              :toggleMask="true"
              class="custom-password w-full h-12"
              inputClass="w-full h-12 text-base"
              :feedback="false"
            />
          </div>
        </div>

        <!-- Bouton de connexion -->
        <Button
          label="Se connecter"
          class="w-full py-3 text-base font-medium rounded-xl flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
          @click="handleLogin"
          :disabled="loading"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-white"></i>
          <span v-else>Se connecter</span>
        </Button>

        <div class="text-center mt-4">
          <RouterLink to="/reset" class="text-sm text-primary hover:underline">
            Mot de passe oublié 
          </RouterLink>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ajuste la taille du champ mot de passe pour correspondre exactement au champ texte */
.custom-password :deep(input) {
  height: 3rem !important;
  width: 100% !important;
  font-size: 1rem;
  border-radius: 0.5rem;
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