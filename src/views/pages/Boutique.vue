


<script setup>
import {
  changePassword,
  checkSecretKeyStatus, createOrUpdateSecretKey,
  createUserProfl,
  deleteSecretKey,
  fecthSubscriptionByUserId, fetchUserById, fetchUserProfilById, updateUserAPI, updateUserProfile
} from '@/service/Api';
import { formatDate } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';


const userProfile = ref(null);
const user = ref(null);
const toast = useToast();
const subscription = ref(null);
const submitted = ref(false);
const showDialog = ref(false);
const showDialogUpdateUser = ref(false);
const isEditMode = ref(true);

const hasSecretKey = ref(false);
const showSecretKeyDialog = ref(false);
const secretKeyForm = ref({
  old_key: '',
  new_key: '',
  confirm_key:''
});
const isCreatingSecret = ref(false);

const userId = localStorage.getItem('id');

const showChangePasswordDialog = ref(false);

const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password:'',
});
const loadingChangePassword = ref(false);
const deleteSecretKeyDialog = ref(false);
const submittedSecret = ref(false)
const secretKey = ref('')
const userStatus = localStorage.getItem('status')

onMounted(async () => {
   await fetchUserProfil();
    await fetchUser();
    await fetchUserSubscription();
    await checkSecretKey();

});


function openChangePasswordDialog() {
  passwordForm.value = { old_password: '', new_password: '' };
  showChangePasswordDialog.value = true;
}

async function handleChangePassword() {
  if (!passwordForm.value.old_password || !passwordForm.value.new_password) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs', life: 3000 });
    return;
  }
  if(passwordForm.value.confirm_password != passwordForm.value.new_password){
    toast.add({ severity: 'warn', summary: 'Attention', detail: "Les mots de passe ne correspondent pas !", life: 3000 });
    return;
  }
  loadingChangePassword.value = true;
  try {
    await changePassword(passwordForm.value.old_password, passwordForm.value.new_password);
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe modifié avec succès', life: 3000 });
    showChangePasswordDialog.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.detail || 'Impossible de changer le mot de passe', life: 3000 });
  } finally {
    loadingChangePassword.value = false;
  }
}
// fonction verifier le code secret
async function checkSecretKey(){
    try{
        const res = await checkSecretKeyStatus()
        hasSecretKey.value = res.has_key || false; 
    } catch (error) {
    console.error("Erreur lors de la vérification du code secret :", error);
  }
}



async function saveSecretKey(){
    try{
        if(!secretKeyForm.value.new_key){
         toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez entrer un nouveau code secret', life: 3000 });
         return;
        }
        if(secretKeyForm.value.confirm_key != secretKeyForm.value.new_key){
           toast.add({ severity: 'warn', summary: 'Attention', detail: "Les mots de passe ne correspondent pas !", life: 3000 });
           return;
        }
        const payload = {};

        
        if(!isCreatingSecret.value){
            if(!secretKeyForm.value.old_key){
                toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez entrer votre ancien code', life: 3000 });
                return ;
             }
             payload.old_key = secretKeyForm.value.old_key;
        }
        payload.new_key = secretKeyForm.value.new_key;
        
        await createOrUpdateSecretKey(payload);
        toast.add({ severity: 'success', summary: 'Succès', detail: isCreatingSecret.value ? 'Code secret créé' : 'Code secret modifié', life: 3000 });
        await checkSecretKey();
       showSecretKeyDialog.value = false;

    } catch (error) {
    console.error("Erreur lors de l'enregistrement du code secret :", error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
  }
}
// ffonction pour supprimer le code secret
async function deteleteKey(){
  submittedSecret.value = true
  if(!secretKey.value) return;
  try{
     const data = {};
     data.old_key = secretKey.value;
     const result = await deleteSecretKey(data);
    
      toast.add({
       severity: 'success',
        summary: 'Succès',
         detail: `${result.detail}`,
        life: 3000 });
   
    deleteSecretKeyDialog.value = false;
  }catch(error){
    console.error("errur lors de la suppression",error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
  }
}

function openDeleteDialog(){
  deleteSecretKeyDialog.value = true;
}

function openSecretKeyDialog(){
    isCreatingSecret.value = !hasSecretKey.value;
    secretKeyForm.value = { old_key:'', new_key:'' };
    showSecretKeyDialog.value = true;
}


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
    id_nat:'',
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

async function updateUser() {
  try {
    // On crée un payload propre
    const payload = {};

    for (const key in form.value) {
      const value = form.value[key];

      // On ne garde que les valeurs remplies
      if (value !== "" && value !== null && value !== undefined) {
        payload[key] = value;
      }
    }

   

    await updateUserAPI(payload);

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Utilisateur mis à jour',
      life: 3000
    });

    await fetchUser(); // recharge les données
    showDialogUpdateUser.value = false;

  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte :", error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de mettre à jour l’utilisateur',
      life: 3000
    });
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
            id_nate:'',
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
async function fetchUserSubscription(){
    try{
        const result = await fecthSubscriptionByUserId(userId);
        subscription.value = Array.isArray(result) ? result[0] : result;
        console.log('Abonnement Utilisateur:', subscription.value);
    }catch(error){
        console.error('Erreur lors de la récupération de l’abonnement', error);
    }
}
function status(statutSubscription){
    return statutSubscription === true ? 'Actif' : 'Expirée';
}
const progressPercent = computed(()=> {
    if (!subscription.value || !subscription.value.start_date || !subscription.value.end_date){
        return 0;
    }
    const start = new Date(subscription.value.start_date);
    const end = new Date(subscription.value.end_date);
    const now = new Date();
    const totalDuration = end - start;
    const elapsed = now - start;
    if (now >= end) return 0;
    if (now <= start) return 100;
    const remainingPercent = ((totalDuration - elapsed) / totalDuration) * 100;
    return Math.max(0, Math.min(100, Math.round(remainingPercent)));
})






</script>
<template>
  <div class="p-6 space-y-6">

    <!-- ================= Profil Boutique ================= -->
    <div class="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <h2 class="text-2xl font-bold text-blue-600 mb-5">Profil de la Boutique</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
        <div><strong>Nom :</strong> {{ userProfile?.entrep_name || 'Non défini' }}</div>
        <div><strong>Numéro d'impôt :</strong> {{ userProfile?.impot_number || 'Non défini' }}</div>
         <div><strong>ID Nat :</strong> {{ userProfile?.id_nat || 'Non défini' }}</div>
        <div><strong>RCCM :</strong> {{ userProfile?.rccm_number || 'Non défini' }}</div>
        <div><strong>Téléphone :</strong> {{ userProfile?.phone_number || 'Non défini' }}</div>
        <div class="sm:col-span-2"><strong>Adresse :</strong> {{ userProfile?.adress || 'Non défini' }}</div>
        <div><strong>Devise :</strong> {{ userProfile?.currency_preference || 'Non défini' }}</div>
        
      </div>
      <div class="mt-5">
        <Button 
          v-if="userStatus =='ADMIN'"
          :label="userProfile ? 'Modifier' : 'Créer le profil'" 
          icon="pi pi-pencil" 
          class="p-button-rounded p-button-sm p-button-info" 
          @click="openEditDialog" 
        />
      </div>
    </div>

    <!-- ================= Utilisateur + Abonnement ================= -->
    <div  class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Colonne Utilisateur -->
      <div class="bg-white shadow-lg rounded-lg p-6 border border-gray-200 space-y-4">
        <h2 class="text-2xl font-bold text-blue-600 mb-4">Informations de l'utilisateur</h2>
        <div class="text-gray-700 space-y-1">
          <div><strong>Nom d'utilisateur :</strong> {{ user?.username || 'Non défini' }}</div>
          <div><strong>Nom :</strong> {{ user?.first_name || 'Non défini' }} {{ user?.last_name || '' }}</div>
          <div><strong>Email :</strong> {{ user?.email || 'Non défini' }}</div>
        </div>

        <div class="flex flex-wrap gap-3 mt-4">
          <Button label="Modifier mes informations" icon="pi pi-user-edit" class="p-button-sm p-button-info" @click="openEditUserDialog"/>
          <Button label="Changer le mot de passe" icon="pi pi-lock" class="p-button-sm p-button-danger" @click="openChangePasswordDialog"/>
          <Button :label="hasSecretKey ? 'Modifier mon code secret' : 'Créer un code secret'" icon="pi pi-key" class="p-button-sm p-button-warning" @click="openSecretKeyDialog"/>
          <Button v-if="hasSecretKey" label="Supprimer le code secrèt" icon="pi pi-trash" class="p-button-sm p-button-danger" @click="openDeleteDialog"/>
        </div>
      </div>

      <!-- Colonne Abonnement -->
      <div v-if="userStatus =='ADMIN'" class="bg-white shadow-lg rounded-lg p-6 border border-gray-200 space-y-4">
        <h2 class="text-2xl font-bold text-blue-600 mb-4">Abonnement</h2>
        <div class="text-gray-700 space-y-2">
          <div class="flex items-center gap-2">
            <strong>Type :</strong>

            <!-- Badge dynamique -->
            <span 
              v-if="subscription?.subscription_type"
              class="px-3 py-1 rounded-full text-white text-sm flex items-center gap-1"
              :class="{
                'bg-red-800': subscription.subscription_type === 'BASIC',
                'bg-green-600': subscription.subscription_type === 'MEDIUM',
                'bg-blue-600': subscription.subscription_type === 'PREMIUM',
                'bg-yellow-500': subscription.subscription_type === 'PLATINUM',
                'bg-gray-700': subscription.subscription_type === 'DIAMOND'
              }"
            >
              <!-- Icônes par type -->
              <i 
                v-if="['MEDIUM','PREMIUM'].includes(subscription.subscription_type)"
                class="pi pi-verified"
              ></i>

              <i 
                v-if="['PLATINUM','DIAMOND'].includes(subscription.subscription_type)"
                class="pi pi-shield"
              ></i>

              {{ subscription.subscription_type }}
            </span>

            <!-- Si pas d'abonnement -->
            <span v-else class="text-gray-500"> </span>
          </div>

          
          <div><strong>Début :</strong> {{ formatDate(subscription?.start_date )}}</div>
          <div><strong>Fin :</strong> {{ formatDate(subscription?.end_date) }}</div>
          <div>
            <strong>Statut :</strong>
            <span :class="status(subscription?.is_active) === 'Actif' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
              {{ status(subscription?.is_active) }}
            </span>
          </div>
          <div v-if="subscription">
            <label class="block font-semibold text-sm mb-1">Durée restante :</label>
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div class="h-4 rounded-full transition-all duration-500"
                   :style="{ width: progressPercent + '%', backgroundColor: subscription.subscription_type === 'PREMIUM' ? '#3b82f6' : '#22c55e' }"></div>
            </div>
            <small>{{ progressPercent }}% restant</small>
          </div>
        </div>
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
        <label class="font-semibold mb-1 block">ID Nat</label>
        <InputText v-model="editedProfile.id_nat" class="w-full" />
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


    <!-- Dialog Code secret -->
  <Dialog v-model:visible="showSecretKeyDialog" :header="isCreatingSecret ? 'Créer un code secret' : 'Modifier le code secret'" :modal="true" :style="{ width: '400px' }">
    <div class="flex flex-col gap-4">
      <div v-if="!isCreatingSecret">
        <label class="font-semibold mb-1 block">Ancien code secret</label>
        <Password v-model="secretKeyForm.old_key" class="w-full" toggleMask />

      </div>

      <div>
        <label class="font-semibold mb-1 block">Nouveau code secret</label>
        <Password v-model="secretKeyForm.new_key" class="w-full" toggleMask />
      </div>

       <div>
        <label class="font-semibold mb-1 block">conrfimer code secret</label>
        <Password v-model="secretKeyForm.confirm_key" class="w-full" toggleMask />
      </div>

    </div>
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="showSecretKeyDialog = false" />
      <Button label="Enregistrer" icon="pi pi-check" @click="saveSecretKey" />
    </template>
  </Dialog>


  <Dialog
    v-model:visible="showChangePasswordDialog"
    header="Changer le mot de passe"
    :modal="true"
    :style="{ width: '400px' }"
  >
  <div class="flex flex-col gap-4">
    <div>
      <label class="font-semibold mb-1 block">Ancien mot de passe</label>
      <Password v-model="passwordForm.old_password" class="w-full" toggleMask feedback="false" />
    </div>

    <div>
      <label class="font-semibold mb-1 block">Nouveau mot de passe</label>
      <Password v-model="passwordForm.new_password" class="w-full" toggleMask feedback="true" />
    </div>

    <div>
      <label class="font-semibold mb-1 block">Confirmer mot de passe</label>
      <Password v-model="passwordForm.confirm_password" class="w-full" toggleMask feedback="true" />
    </div>

  </div>

  <template #footer>
    <Button label="Annuler" icon="pi pi-times" text @click="showChangePasswordDialog = false" />
    <Button 
      label="Changer" 
      icon="pi pi-check" 
      :loading="loadingChangePassword" 
      @click="handleChangePassword" 
    />
  </template>
</Dialog>




    <Dialog
      v-model:visible="deleteSecretKeyDialog"
      modal
      header="Vérification du code secret"
      :style="{ width: '400px' }"
      class="p-fluid"
      >
  <div class="field mb-4">
    <label for="secret" class="block text-sm font-medium text-gray-700 mb-2">
      Entrez le code secret pour supprimer
    </label>
    <Password
      id="secret"
      v-model="secretKey"
      toggleMask
      feedback="false"
      placeholder="Code secret"
      class="w-full"
    />
    <small v-if="submittedSecret && !secretKey" class="p-error block mt-1">
      Le code secret est requis.
    </small>
  </div>

  <div class="flex justify-end gap-2">
    <Button
      label="Annuler"
      icon="pi pi-times"
      severity="secondary"
      @click="deleteSecretKeyDialog =false"
    />
    <Button
      label="Vérifier"
      icon="pi pi-check"
      severity="success"
      @click="deteleteKey"
    />
  </div>
</Dialog>

  </div>
</template>