


<script setup>
import { useGlobalAlert } from '@/layout/composables/useGlobalAlert';
import {
  changePassword,
  checkSecretKeyStatus, createOrUpdateSecretKey,
  createUserProfl,
  deleteSecretKey,
  fecthSubscriptionByUserId, fetchUserById, fetchUserProfilById,
  togglePoint,
  updateUserAPI, updateUserProfile
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

const { showAlert } = useGlobalAlert()


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

async function togglePoints(){
    const res = await togglePoint(userProfile.value?.id)
  userProfile.value.point_is_activate = res.data.point_is_activate
  fetchUserProfil();
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

            userProfile.value.point_output = editedProfile.value.point_output;
            userProfile.value.point_entry = editedProfile.value.point_entry;
            userProfile.value.exchange_rate = editedProfile.value.exchange_rate;

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

const subBadgeClass = (type) => ({
  BASIC:     'sub-basic',
  MEDIUM:    'sub-medium',
  PREMIUM:   'sub-premium',
  PLATINUM:  'sub-platinum',
  DIAMOND:   'sub-diamond',
}[type] ?? '')






</script>

<template>
<div class="settings-shell">

  <!-- ═══════════════ PROFIL BOUTIQUE ═══════════════ -->
  <div class="settings-card">

    <div class="card-header">
      <div class="card-title">
        <div class="title-icon">
          <i class="pi pi-shopping"></i>
        </div>
        <div>
          <h2>Profil de la Boutique</h2>
          <p class="card-subtitle">Informations légales et commerciales</p>
        </div>
      </div>
      <Button
        v-if="userStatus == 'ADMIN'"
        :label="userProfile ? 'Modifier' : 'Créer le profil'"
        icon="pi pi-pencil"
        rounded
        outlined
        size="small"
        @click="openEditDialog"
      />
    </div>

    <!-- Infos boutique -->
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nom</span>
        <span class="info-value">{{ userProfile?.entrep_name || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">N° Impôt</span>
        <span class="info-value">{{ userProfile?.impot_number || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">ID Nat</span>
        <span class="info-value">{{ userProfile?.id_nat || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">RCCM</span>
        <span class="info-value">{{ userProfile?.rccm_number || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Téléphone</span>
        <span class="info-value">{{ userProfile?.phone_number || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type d'activité</span>
        <span class="info-value">{{ userProfile?.type_of_activity || '—' }}</span>
      </div>
      <div class="info-item info-item-full">
        <span class="info-label">Adresse</span>
        <span class="info-value">{{ userProfile?.adress || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Devise</span>
        <span class="info-value">{{ userProfile?.currency_preference || '—' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Taux de change</span>
        <span class="badge badge-green">{{ userProfile?.exchange_rate || '—' }}</span>
      </div>
    </div>

    <!-- Points fidélité -->
    <div class="loyalty-section">
      <div class="loyalty-header">
        <i class="pi pi-star-fill"></i>
        <span>Gestion des Points de Fidélité</span>
      </div>

      <div class="loyalty-cards">

        <div class="loyalty-card">
          <div class="loyalty-card-label">Valeur d'un point (Entrée)</div>
          <div class="loyalty-card-value green">
            {{ userProfile?.point_entry || 0 }}
            <span class="loyalty-currency">{{ userProfile?.currency_preference }}</span>
          </div>
          <div class="loyalty-card-icon">
            <i class="pi pi-arrow-down-left"></i>
          </div>
        </div>

        <div class="loyalty-card">
          <div class="loyalty-card-label">Valeur d'un point (Sortie)</div>
          <div class="loyalty-card-value red">
            {{ userProfile?.point_output || 0 }}
            <span class="loyalty-currency">{{ userProfile?.currency_preference }}</span>
          </div>
          <div class="loyalty-card-icon red">
            <i class="pi pi-arrow-up-right"></i>
          </div>
        </div>

        <div class="loyalty-card">
          <div class="loyalty-card-label">Statut du programme</div>
          <div class="loyalty-toggle-row">
            <button
              @click="togglePoints"
              class="toggle-switch"
              :class="userProfile?.point_is_activate ? 'toggle-on' : 'toggle-off'"
            >
              <span class="toggle-knob" :class="userProfile?.point_is_activate ? 'knob-on' : 'knob-off'"></span>
            </button>
            <span :class="userProfile?.point_is_activate ? 'status-on' : 'status-off'">
              {{ userProfile?.point_is_activate ? 'Activé' : 'Désactivé' }}
            </span>
          </div>
          <div class="loyalty-card-icon" :class="userProfile?.point_is_activate ? '' : 'muted'">
            <i class="pi pi-power-off"></i>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ═══════════════ UTILISATEUR + ABONNEMENT ═══════════════ -->
  <div class="two-col-grid">

    <!-- Utilisateur -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-title">
          <div class="title-icon indigo">
            <i class="pi pi-user"></i>
          </div>
          <div>
            <h2>Mon compte</h2>
            <p class="card-subtitle">Identité et sécurité</p>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item info-item-full">
          <span class="info-label">Nom d'utilisateur</span>
          <span class="info-value">{{ user?.username || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nom complet</span>
          <span class="info-value">{{ user?.first_name || '—' }} {{ user?.last_name || '' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user?.email || '—' }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button class="act-btn act-info" @click="openEditUserDialog">
          <i class="pi pi-user-edit"></i> Modifier
        </button>
        <button class="act-btn act-danger" @click="openChangePasswordDialog">
          <i class="pi pi-lock"></i> Mot de passe
        </button>
        <button class="act-btn act-warning" @click="openSecretKeyDialog">
          <i class="pi pi-key"></i> {{ hasSecretKey ? 'Code secret' : 'Créer code' }}
        </button>
        <button v-if="hasSecretKey" class="act-btn act-danger" @click="openDeleteDialog">
          <i class="pi pi-trash"></i> Supprimer code
        </button>
      </div>
    </div>

    <!-- Abonnement -->
    <div v-if="userStatus == 'ADMIN'" class="settings-card">
      <div class="card-header">
        <div class="card-title">
          <div class="title-icon amber">
            <i class="pi pi-crown"></i>
          </div>
          <div>
            <h2>Abonnement</h2>
            <p class="card-subtitle">Plan et validité</p>
          </div>
        </div>
        <span
          v-if="subscription?.subscription_type"
          class="subscription-badge"
          :class="subBadgeClass(subscription.subscription_type)"
        >
          <i v-if="['MEDIUM','PREMIUM'].includes(subscription.subscription_type)" class="pi pi-verified"></i>
          <i v-if="['PLATINUM','DIAMOND'].includes(subscription.subscription_type)" class="pi pi-shield"></i>
          {{ subscription.subscription_type }}
        </span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Début</span>
          <span class="info-value">{{ formatDate(subscription?.start_date) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fin</span>
          <span class="info-value">{{ formatDate(subscription?.end_date) }}</span>
        </div>
        <div class="info-item info-item-full">
          <span class="info-label">Statut</span>
          <span :class="status(subscription?.is_active) === 'Actif' ? 'badge badge-green' : 'badge badge-red'">
            {{ status(subscription?.is_active) }}
          </span>
        </div>
      </div>

      <div v-if="subscription" class="progress-section">
        <div class="progress-header">
          <span class="info-label">Durée restante</span>
          <span class="progress-pct">{{ progressPercent }}%</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            :style="{
              width: progressPercent + '%',
              background: subscription.subscription_type === 'PREMIUM'
                ? 'linear-gradient(90deg,#6366f1,#818cf8)'
                : 'linear-gradient(90deg,#16a34a,#4ade80)'
            }"
          ></div>
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
    <div>
        <label class="font-semibold mb-1 block">Taux de change</label>
        <InputText v-model="editedProfile.exchange_rate" class="w-full" />
      </div>
     <div>

        <label class="font-semibold mb-1 block">Valeur d'un point (Entrée)</label>
        <InputText v-model="editedProfile.point_entry" class="w-full" />
      </div>

      <div>
        <label class="font-semibold mb-1 block">Valeur d'un point (Sortie)</label>
        <InputText v-model="editedProfile.point_output" class="w-full" />
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



<style scoped>
/* ── Shell ──────────────────────────────────────────────── */
.settings-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: #f1f5f9;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Cards ──────────────────────────────────────────────── */
.settings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

/* ── Card header ────────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-icon {
  width: 40px; height: 40px;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}
.title-icon.indigo { background: #eef2ff; color: #6366f1; }
.title-icon.amber  { background: #fffbeb; color: #d97706; }

.card-title h2 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.card-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
}

/* ── Info grid ──────────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.info-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-item-full { grid-column: 1 / -1; }
.info-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* ── Badges ─────────────────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.badge-green { background: #dcfce7; color: #16a34a; }
.badge-red   { background: #fee2e2; color: #dc2626; }

/* ── Loyalty section ────────────────────────────────────── */
.loyalty-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.loyalty-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700;
  color: #6366f1;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.loyalty-header .pi { font-size: 14px; }

.loyalty-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.loyalty-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.loyalty-card-label {
  font-size: 11px; font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.loyalty-card-value {
  font-size: 22px; font-weight: 800;
  display: flex; align-items: baseline; gap: 4px;
}
.loyalty-card-value.green { color: #16a34a; }
.loyalty-card-value.red   { color: #dc2626; }
.loyalty-currency { font-size: 12px; font-weight: 500; color: #94a3b8; }

.loyalty-card-icon {
  position: absolute;
  top: 12px; right: 12px;
  width: 28px; height: 28px;
  background: #dcfce7; color: #16a34a;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}
.loyalty-card-icon.red   { background: #fee2e2; color: #dc2626; }
.loyalty-card-icon.muted { background: #f1f5f9; color: #94a3b8; }

/* Toggle switch */
.loyalty-toggle-row {
  display: flex; align-items: center; gap: 8px; margin-top: 4px;
}
.toggle-switch {
  position: relative;
  width: 46px; height: 26px;
  border-radius: 99px; border: none;
  cursor: pointer; transition: background .2s;
  flex-shrink: 0;
}
.toggle-on  { background: #16a34a; }
.toggle-off { background: #cbd5e1; }
.toggle-knob {
  position: absolute; top: 3px;
  width: 20px; height: 20px;
  background: #fff; border-radius: 50%;
  transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.knob-on  { transform: translateX(22px); }
.knob-off { transform: translateX(3px); }
.status-on  { font-size: 13px; font-weight: 700; color: #16a34a; }
.status-off { font-size: 13px; font-weight: 700; color: #94a3b8; }

/* ── Action buttons ─────────────────────────────────────── */
.action-buttons {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.act-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  border: none; cursor: pointer; transition: all .15s;
}
.act-info    { background: #eef2ff; color: #4f46e5; }
.act-info:hover    { background: #6366f1; color: #fff; }
.act-danger  { background: #fee2e2; color: #dc2626; }
.act-danger:hover  { background: #ef4444; color: #fff; }
.act-warning { background: #fffbeb; color: #d97706; }
.act-warning:hover { background: #f59e0b; color: #fff; }

/* ── Subscription badge ─────────────────────────────────── */
.subscription-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.sub-basic    { background: #fee2e2; color: #991b1b; }
.sub-medium   { background: #dcfce7; color: #15803d; }
.sub-premium  { background: #dbeafe; color: #1d4ed8; }
.sub-platinum { background: #fef9c3; color: #a16207; }
.sub-diamond  { background: #f3e8ff; color: #7e22ce; }

/* ── Progress ───────────────────────────────────────────── */
.progress-section { display: flex; flex-direction: column; gap: 6px; }
.progress-header {
  display: flex; justify-content: space-between; align-items: center;
}
.progress-pct { font-size: 13px; font-weight: 700; color: #1e293b; }
.progress-track {
  height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden;
}
.progress-bar {
  height: 100%; border-radius: 99px;
  transition: width .5s ease;
}

/* ── Two col ────────────────────────────────────────────── */
.two-col-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .two-col-grid { grid-template-columns: 1fr; }
  .loyalty-cards { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>