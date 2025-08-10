


<script setup>
import { createUserProfl, fetchUserById, fetchUserProfilById, updateUserAPI, updateUserProfile } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';


const userProfile = ref(null);
const user = ref(null);
const toast = useToast();
const submitted = ref(false);
const showDialog = ref(false);
const showDialogUpdateUser = ref(false);
const isEditMode = ref(true);



const userId = localStorage.getItem('id');


onMounted(async () => {
    fetchUserProfil();
    fetchUser();
});


async function fetchUserProfil(){
    const userId = localStorage.getItem('id');
    try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        console.log('Profil utilisateur récupéré :', result);
    } catch(error){
        console.error('Erreur lors de la récuperation du profi utilisateur', error);
    }
}

async function  fetchUser() {
    try{
        const result = await fetchUserById(userId);
        user.value = Array.isArray(result) ? result[0] : result;
        console.log('User :', user.value) 
    } catch(error){
        console.error('erreur de recuperation de user', error);
    }
}


const editedProfile = ref({
    user:userId,
    entrep_name :'',
    impot_number :'',
    rccm_number :'',
    phone_number:'',
    adress:'',
    currency_preference:'',
});
const form = ref({
    id:userId,
    username:'',
    first_name:'',
    last_name:'',
    email:'',

});

function openEditUserDialog(){
    if(user.value){
        form.value = { ...user.value};
    }
    showDialogUpdateUser.value = true;
}

async function updateUser(){
    try {
        const payload = { ...form.value };
        delete payload.username; // Supprime le username du corps de la requête

        await updateUserAPI(payload);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Informations utilisateur mises à jour', life: 3000 });
        await fetchUser();
        showDialogUpdateUser.value = false;
    } catch(error) {
        console.error("Erreur lors de la mise à jour du compte :", error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
    }
}
// fonction pour modier le profile
function openEditDialog(){

    if(userProfile.value){
        isEditMode.value = true;
        editedProfile.value = { ...userProfile.value};
    }else{
        isEditMode.value = false;
        editedProfile.value= {
            user: userId,
            entrep_name: '',
            impot_number: '',
            rccm_number: '',
            phone_number: '',
            adress: '',
            currency_preference: '',
        };
    }
    showDialog.value = true;
}

async function saveProfile(){
    submitted.value = true;
    if(!editedProfile.value.entrep_name) return;
        
    try{
        if(isEditMode.value){
            await updateUserProfile(editedProfile.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour', life: 3000 });
        }else{
            await createUserProfl(editedProfile.value);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil créé', life: 3000 });
        }
        await fetchUserProfil();
        showDialog.value = false;
    } catch(error){
        console.error("Erreur lors de la mise à jour du profil :", error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
    }
}






</script>

<template>
   <div class="grid md:grid-cols-2 gap-6 card">
    <div>
      <div class="font-semibold text-xl mb-4 text-primary">Profil de la Boutique</div>
      <div class="mb-2"><strong>Nom de la boutique :</strong> {{ userProfile ? userProfile.entrep_name : 'Non défini' }}</div>
      <div class="mb-2"><strong>Numéro d'impôt :</strong> {{ userProfile ? userProfile.impot_number : 'Non défini' }}</div>
      <div class="mb-2"><strong>RCCM :</strong> {{ userProfile ? userProfile.rccm_number : 'Non défini' }}</div>
      <div class="mb-2"><strong>Téléphone :</strong> {{ userProfile ? userProfile.phone_number : 'Non défini' }}</div>
      <div class="mb-2"><strong>Adresse :</strong> {{ userProfile ? userProfile.adress : 'Non défini' }}</div>
      <div class="mb-2"><strong>Devise :</strong> {{ userProfile ? userProfile.currency_preference : 'Non défini' }}</div>
      <Button 
        :label="userProfile ? 'Modifier' : 'Créer le profil'" 
        icon="pi pi-pencil" 
        class="mt-4" 
        @click="openEditDialog" 
      />
    </div>

    <div>
      <div class="font-semibold text-xl mb-4 text-primary">Informations de l'utilisateur</div>
       <div class="mb-2"><strong>Nom d'utilisateur :</strong>{{ user? user.username :'Non défini' }} </div>
      <div class="mb-2"><strong>Nom :</strong>{{ user?.first_name || 'Non défini' }} {{ user?.last_name || '' }} </div>
      <div class="mb-2"><strong>Email :</strong>{{ user?.email }} </div>
      <Button label="Modifier mes informations" icon="pi pi-user-edit" class="mt-4" @click="openEditUserDialog" />
    </div>


    </div>
      <Dialog v-model:visible="showDialog" header="Modifier le Profil" :modal="true" :style="{ width: '450px' }">
    <div class="flex flex-col gap-4">
      <div>
        <label class="font-semibold mb-1 block">Nom de la boutique</label>
        <InputText v-model="editedProfile.entrep_name" class="w-full" :invalid="submitted && !editedProfile.entrep_name" />
        <small v-if="submitted && !editedProfile.entrep_name" class="text-red-500">Ce champ est requis.</small>
      </div>

      <div>
        <label class="font-semibold mb-1 block">Numéro d'impôt</label>
        <InputText v-model="editedProfile.impot_number" class="w-full" />
      </div>

      <div>
        <label class="font-semibold mb-1 block">RCCM</label>
        <InputText v-model="editedProfile.rccm_number" class="w-full" />
      </div>

      <div>
        <label class="font-semibold mb-1 block">Téléphone</label>
        <InputText v-model="editedProfile.phone_number" class="w-full" />
      </div>

      <div>
        <label class="font-semibold mb-1 block">Adresse</label>
        <InputText v-model="editedProfile.adress" class="w-full" />
      </div>

      <div>
        <label class="font-semibold mb-1 block">Devise</label>
        <select v-model="editedProfile.currency_preference" class="w-full border rounded px-2 py-1">
          <option value="CDF">CDF</option>
          <option value="USD">USD</option>
        </select>
      </div>
    </div>

    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="showDialog = false" />
      <Button label="Enregistrer" icon="pi pi-check" @click="saveProfile" />
    </template>
  </Dialog>
  <!-- Dialog Modification Utilisateur -->
  <Dialog v-model:visible="showDialogUpdateUser" header="Modifier mes informations" :modal="true" :style="{ width: '450px' }">
    <div class="flex flex-col gap-4">
      <div>
        <label class="font-semibold mb-1 block">Nom d'utilisateur</label>
        <InputText v-model="form.username" class="w-full" />
      </div>
      <div>
        <label class="font-semibold mb-1 block">Prénom</label>
        <InputText v-model="form.first_name" class="w-full" />
      </div>
      <div>
        <label class="font-semibold mb-1 block">Nom</label>
        <InputText v-model="form.last_name" class="w-full" />
      </div>
      <div>
        <label class="font-semibold mb-1 block">Email</label>
        <InputText v-model="form.email" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="showDialogUpdateUser = false" />
      <Button label="Enregistrer" icon="pi pi-check" @click="updateUser" />
    </template>
  </Dialog>

</template>