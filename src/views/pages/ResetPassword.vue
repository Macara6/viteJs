


<script setup>

import { confirmPasswordReset, requestPasswordReset } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();


const email = ref('');
const code = ref('');
const newPassword = ref('');
const loading = ref(false);
const step = ref(1);
const toast = useToast();

const handleRequestReset = async () => {
   loading.value = true;
   try{
        const res = await requestPasswordReset(email.value);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Un email de réinitialisation a été envoyé', life: 3000 });
        step.value =2;

   }catch(err){
     toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'envoyer l'email", life: 4000 });
   }finally{
    loading.value = false;
   }

}
const handleConfirmReset  = async () => {
    loading.value = true;
    try{
        const res = await confirmPasswordReset(code.value, newPassword.value);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe réinitialisé avec succès.', life: 3000 });
        router.push('/login');
    }catch(err){
        toast.add({ severity: 'error', summary: 'Erreur', detail: err.response?.data?.detail || 'Code invalide', life: 4000 });
    }finally{
        loading.value = false;
    }
}

</script>


<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-primary">🔐 Mot de passe oublié</h2>
        <p class="text-gray-500 text-sm mt-2">
          {{
            step === 1
              ? "Entrez votre adresse e-mail pour recevoir un code de réinitialisation."
              : "Entrez le code reçu et définissez votre nouveau mot de passe."
          }}
        </p>
      </div>

      <!-- Étape 1 : Demande d'e-mail -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
          <InputText
            v-model="email"
            placeholder="exemple@email.com"
            class="w-full"
            type="email"
            :disabled="loading"
          />
        </div>

        <Button
          label="Envoyer le code"
          icon="pi pi-send"
          class="w-full p-button-primary"
          :loading="loading"
          @click="handleRequestReset"
        />

        <div class="text-center mt-4">
          <RouterLink to="/login" class="text-sm text-primary hover:underline">
            Retour à la connexion
          </RouterLink>
        </div>
      </div>

      <!-- Étape 2 : Confirmation du code -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code de réinitialisation</label>
          <InputText
            v-model="code"
            placeholder="Entrez le code reçu"
            class="w-full"
            maxlength="6"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe (6 caracteurs) </label>
          <Password
            v-model="newPassword"
            placeholder="Nouveau mot de passe"
            class="w-full"
            toggleMask
            :feedback="true"
            :disabled="loading"
          />
        </div>

        <Button
          label="Réinitialiser le mot de passe"
          icon="pi pi-check"
          class="w-full p-button-success"
          :loading="loading"
          @click="handleConfirmReset"
        />

        <div class="text-center mt-4">
          <Button
            label="🔁 Revenir à l’étape précédente"
            text
            icon="pi pi-arrow-left"
            @click="step = 1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: #2563eb; /* Bleu pro */
}
</style>

