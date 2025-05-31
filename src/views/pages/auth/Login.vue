<script setup>

import { login } from '@/service/Api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');
const errorMessage = ref('');


const handleLogin = async() => {
    errorMessage.value = '';

    if(!username.value || !password.value){
        errorMessage.value='Please enter both username and password';
        return;
    }
    try {

       const userData = await login(username.value, password.value); 

       if (userData && userData.token){
        
            if(userData.is_superuser){
                router.push('/pages/Subscription'); 
            } else{
                router.push('/pages/Bilan'); 
            }
        

       }else{
        throw new Error('Login failed: No user data returned');
       }
        
    } catch (error) {
        console.error('Login failed:', error);
        
        if (error.response && error.response.status === 401){
            errorMessage.value = "Vontre abonnement a expirer ou compte non touvé.";

        } else if(error.response && error.response.status ===400) {
            errorMessage.value = 'Aucun abonnement trouver pour cette utilisateur';
        } else(
            errorMessage.value = 'Compte nom trouvee'
        )

    }
  
}


</script>

<template>
   
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">BilaTech Solution</div>
                        <span class="text-muted-color font-medium">connecte toi pour contunué</span>
                    </div>
                    <div v-if="errorMessage" class="text-red-500 mt-2 text-center w-full">{{ errorMessage }}</div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nom  Utilisateur</label>
                        <InputText id="username1" type="text" placeholder="Nom Utilisateur" class="w-full md:w-[30rem] mb-8" v-model="username" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        
                        <Button label="Sign In" class="w-full" @click="handleLogin"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
