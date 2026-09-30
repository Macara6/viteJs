


<script setup>
import SecretCodeDialog from '@/components/SecretCodeDialog.vue';
import { useGlobalAlert } from '@/layout/composables/useGlobalAlert';
import {
  changePassword,
  checkSecretKeyStatus, createOrUpdateSecretKey,
  createUserProfl,
  deleteSecretKey,
  fecthSubscriptionByUserId, fetchUserById, fetchUserProfilById,
  rechargeBalanceAPI,
  togglePoint,
  updateUserAPI, updateUserProfile
} from '@/service/Api';
import { formatDate } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

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
const showRechargeDialog = ref(false);



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

const verifiedSecretCode = ref('')
const secretValidated = ref(false)

function handleSecretCode(code) {
  console.log('Code reçu :', code)

  verifiedSecretCode.value = code

  console.log(
    'Code sauvegardé :',
    verifiedSecretCode.value
  )

  // Si la validation est déjà arrivée
  if (secretValidated.value) {
    deteleteKey(true)
  }
}

function handleSecretVerification(result) {
  console.log('Résultat reçu :', result)

  if (result === true) {

    secretValidated.value = true

    // Si le code est déjà arrivé
    if (verifiedSecretCode.value) {
      deteleteKey(true)
    }
  }
}


async function deteleteKey(result) {

  if (result !== true) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Code secret invalide',
      life: 3000
    })
    return
  }

  try {
    console.log(
      'Code avant API :',
      verifiedSecretCode.value
    )
    const data = {
      old_key: verifiedSecretCode.value
    }

    console.log('data key :', data)

    await deleteSecretKey(data)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Code secret supprimé',
      life: 3000
    })

    deleteSecretKeyDialog.value = false

    // Seulement après l'envoi réussi
    verifiedSecretCode.value = ''

  } catch (error) {

    console.error('Erreur lors de la suppression', error)

    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Une erreur est survenue',
      life: 3000
    })
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

const proges = ref(0);

const subBadgeClass = (type) => ({
  BASIC:     'sub-basic',
  MEDIUM:    'sub-medium',
  PREMIUM:   'sub-premium',
  PLATINUM:  'sub-platinum',
  DIAMOND:   'sub-diamond',
}[type] ?? '')

// bloc pour le recharge

const showDialogRecharge = () =>{
  showRechargeDialog.value = true;

}

const rechargeAmount = ref('')
const paymentMethod = ref('') 
const phone = ref('')
const isLoading = ref(false)

const choosePayment = (method) => {
   paymentMethod.value = method 

  }

const processRecharge = async () => {

  if(!rechargeAmount.value)return;

  if (!paymentMethod.value) { return } 
  
  if (phone.value.length !== 9) { return }

  const  recharge_data = {
    user: localStorage.getItem('id'),
    phone_number: `+243${phone.value}`,
    provider: paymentMethod.value,
    amount:rechargeAmount.value
  }

  try{
    isLoading.value = true
    const response = await rechargeBalanceAPI(recharge_data)
    user.value.balance = response.newBalance
    showRechargeDialog.value = false

    toast.add({ severity: 'success', summary: 'Succès', detail: 'recharge a été enregistrée avec succès', life: 3000 });
  
  }catch(error){
   
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
    const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Une erreur est survenue lors de la recharge"
    console.log('message :', message)

  }finally{
    isLoading.value = false;
  }
  
}



</script>

<template>
  
<div class="flex flex-col gap-6">

  <!-- ═══════════════ PROFIL BOUTIQUE ═══════════════ -->
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

    <!-- HEADER -->
    <div class="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
      <div class="flex items-center gap-4">
        <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-600">
          <i class="pi pi-briefcase text-lg"></i>
        </div>
        <div>
          <h2 class="text-base font-semibold text-gray-900 m-0">Profil de la Boutique</h2>
          <p class="text-sm text-gray-500 m-0">Informations légales et commerciales</p>
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

    <!-- INFOS BOUTIQUE -->
    <div class="px-6 py-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Nom</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.entrep_name || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">N° Impôt</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.impot_number || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">ID Nat</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.id_nat || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">RCCM</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.rccm_number || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Téléphone</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.phone_number || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Type d'activité</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.type_of_activity || '—' }}</span>
        </div>

        <div class="sm:col-span-2 lg:col-span-2 flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Adresse</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.adress || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Devise</span>
          <span class="text-sm font-semibold text-gray-900">{{ userProfile?.currency_preference || '—' }}</span>
        </div>

        <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Taux de change</span>
          <Tag
            :value="userProfile?.exchange_rate ? String(userProfile.exchange_rate) : '—'"
            severity="success"
            class="w-fit !rounded-full !px-3 !py-1"
          />
        </div>

      </div>
    </div>

    <Divider class="!my-0" />

    <!-- POINTS FIDÉLITÉ -->
    <div class="px-6 py-5">
      <div class="flex items-center gap-2 mb-4">
        <i class="pi pi-star-fill text-amber-500"></i>
        <span class="text-sm font-semibold text-gray-800">Gestion des Points de Fidélité</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <!-- Point entrée -->
        <div class="relative overflow-hidden p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div class="flex items-center justify-center absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600">
            <i class="pi pi-arrow-down-left text-sm"></i>
          </div>
          <div class="text-xs font-medium text-emerald-700/80 uppercase tracking-wide mb-2">
            Valeur d'un point (Entrée)
          </div>
          <div class="text-xl font-bold text-emerald-700">
            {{ userProfile?.point_entry || 0 }}
            <span class="text-sm font-medium text-emerald-600/70">{{ userProfile?.currency_preference }}</span>
          </div>
        </div>

        <!-- Point sortie -->
        <div class="relative overflow-hidden p-4 rounded-xl bg-rose-50 border border-rose-100">
          <div class="flex items-center justify-center absolute top-3 right-3 w-8 h-8 rounded-lg bg-rose-100 text-rose-600">
            <i class="pi pi-arrow-up-right text-sm"></i>
          </div>
          <div class="text-xs font-medium text-rose-700/80 uppercase tracking-wide mb-2">
            Valeur d'un point (Sortie)
          </div>
          <div class="text-xl font-bold text-rose-700">
            {{ userProfile?.point_output || 0 }}
            <span class="text-sm font-medium text-rose-600/70">{{ userProfile?.currency_preference }}</span>
          </div>
        </div>

        <!-- Statut programme -->
        <div
          class="relative overflow-hidden p-4 rounded-xl border"
          :class="userProfile?.point_is_activate
            ? 'bg-indigo-50 border-indigo-100'
            : 'bg-gray-50 border-gray-200'"
        >
          <div
            class="flex items-center justify-center absolute top-3 right-3 w-8 h-8 rounded-lg"
            :class="userProfile?.point_is_activate
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-200 text-gray-400'"
          >
            <i class="pi pi-power-off text-sm"></i>
          </div>
          <div
            class="text-xs font-medium uppercase tracking-wide mb-3"
            :class="userProfile?.point_is_activate ? 'text-indigo-700/80' : 'text-gray-500'"
          >
            Statut du programme
          </div>
          <div class="flex items-center gap-3">
            <InputSwitch
              :modelValue="userProfile?.point_is_activate"
              @click="togglePoints"
            />
            <span
              class="text-sm font-semibold"
              :class="userProfile?.point_is_activate ? 'text-indigo-700' : 'text-gray-500'"
            >
              {{ userProfile?.point_is_activate ? 'Activé' : 'Désactivé' }}
            </span>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- ═══════════════ UTILISATEUR + ABONNEMENT ═══════════════ -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Utilisateur -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      <!-- HEADER -->
      <div class="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-white">
        <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600">
          <i class="pi pi-user text-lg"></i>
        </div>
        <div>
          <h2 class="text-base font-semibold text-gray-900 m-0">Mon compte</h2>
          <p class="text-sm text-gray-500 m-0">Identité et sécurité</p>
        </div>
      </div>

      <!-- INFOS -->
      <div class="px-6 py-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div class="sm:col-span-2 flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Nom d'utilisateur</span>
            <span class="text-sm font-semibold text-gray-900">{{ user?.username || '—' }}</span>
          </div>

          <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Nom complet</span>
            <span class="text-sm font-semibold text-gray-900">
              {{ user?.first_name || '—' }} {{ user?.last_name || '' }}
            </span>
          </div>

          <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</span>
            <span class="text-sm font-semibold text-gray-900 truncate">{{ user?.email || '—' }}</span>
          </div>

          <!-- BALANCE mise en avant -->
          <div class="sm:col-span-2 flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600">
                <i class="pi pi-wallet"></i>
              </div>
              <span class="text-sm font-medium text-emerald-700">Balance</span>
            </div>
            <span class="text-lg font-bold text-emerald-700">{{ user?.balance || '-' }} USD</span>
          </div>

        </div>
      </div>

      <Divider class="!my-0" />

      <!-- ACTIONS -->
      <div class="px-6 py-5 flex flex-wrap gap-2">
        <Button
          label="Modifier"
          icon="pi pi-user-edit"
          severity="info"
          outlined
          size="small"
          @click="openEditUserDialog"
        />
        <Button
          label="Mot de passe"
          icon="pi pi-lock"
          severity="danger"
          outlined
          size="small"
          @click="openChangePasswordDialog"
        />
        <Button
          :label="hasSecretKey ? 'Code secret' : 'Créer code'"
          icon="pi pi-key"
          severity="warning"
          outlined
          size="small"
          @click="openSecretKeyDialog"
        />
        <Button
          v-if="hasSecretKey"
          label="Supprimer code"
          icon="pi pi-trash"
          severity="danger"
          outlined
          size="small"
          @click="openDeleteDialog"
        />
        <Button
          label="Recharger balance"
          icon="pi pi-send"
          severity="success"
          outlined
          size="small"
          @click="showDialogRecharge"
        />
      </div>

    </div>

    <!-- Abonnement -->
    <div v-if="userStatus == 'ADMIN'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      <!-- HEADER -->
      <div class="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-white">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 text-amber-600">
            <i class="pi pi-server text-lg"></i>
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 m-0">Abonnement</h2>
            <p class="text-sm text-gray-500 m-0">Plan et validité</p>
          </div>
        </div>

        <Tag
          v-if="subscription?.subscription_type"
          :value="subscription.subscription_type"
          :class="subBadgeClass(subscription.subscription_type)"
          class="!px-3 !py-1.5 !rounded-full !text-xs !font-semibold"
        >
          <template #icon>
            <i
              v-if="['MEDIUM','PREMIUM'].includes(subscription.subscription_type)"
              class="pi pi-verified mr-1"
            ></i>
            <i
              v-if="['PLATINUM','DIAMOND'].includes(subscription.subscription_type)"
              class="pi pi-shield mr-1"
            ></i>
          </template>
        </Tag>
      </div>

      <!-- CONTENU -->
      <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Infos texte -->
        <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Début</span>
            <span class="text-sm font-semibold text-gray-900">{{ formatDate(subscription?.start_date) }}</span>
          </div>

          <div class="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Fin</span>
            <span class="text-sm font-semibold text-gray-900">{{ formatDate(subscription?.end_date) }}</span>
          </div>

          <div class="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Statut</span>
            <Tag
              :value="status(subscription?.is_active)"
              :severity="status(subscription?.is_active) === 'Actif' ? 'success' : 'danger'"
              class="!rounded-full !px-3 !py-1"
            />
          </div>

        </div>

        <!-- Knob progression -->
        <div
          v-if="subscription"
          class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100"
        >
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Durée restante</span>
          <Knob
            :modelValue="progressPercent"
            :min="0"
            :max="100"
            :size="120"
            readonly
            :valueTemplate="'{value}%'"
            :valueColor="subscription.subscription_type === 'PREMIUM' ? '#6366f1' : '#16a34a'"
            rangeColor="#e5e7eb"
          />
        </div>

      </div>
    </div>

  </div>




<Dialog
    v-model:visible="showRechargeDialog"
    :modal="true"
    :style="{ width: '560px' }"
    :closable="false"
    class="recharge-dialog"
>
    <div class="space-y-7">

        <!-- HEADER -->
        <div class="flex flex-col items-center text-center gap-3 pt-2">
            <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#004D4A]/10 text-[#004D4A]">
                <i class="pi pi-wallet text-2xl"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-slate-800">
                    Recharger votre balance
                </h2>
                <p class="text-sm text-slate-500 mt-1 max-w-sm">
                    Rechargez votre solde pour permettre le renouvellement
                    automatique de votre abonnement.
                </p>
            </div>
        </div>

        <!-- MONTANT -->
        <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700">
                Montant à recharger
            </label>

            <div class="flex items-center gap-3 border border-slate-200 rounded-xl
                        px-4 bg-white transition-all
                        focus-within:border-[#004D4A] focus-within:ring-4 focus-within:ring-[#004D4A]/10">

                <i class="pi pi-dollar text-slate-300"></i>

                <input
                    v-model="rechargeAmount"
                    type="number"
                    min="1"
                    placeholder="Ex : 10"
                    class="flex-1 py-3.5 outline-none text-slate-800 text-base font-medium bg-transparent"
                />

                <span class="text-xs font-bold text-[#004D4A] bg-[#004D4A]/10 px-2.5 py-1 rounded-lg">
                    USD
                </span>
            </div>
        </div>

        <!-- TITRE PAIEMENT -->
        <div class="flex items-center gap-3">
            <div class="h-px flex-1 bg-slate-100"></div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Choisissez un moyen de paiement
            </p>
            <div class="h-px flex-1 bg-slate-100"></div>
        </div>

        <!-- MÉTHODES DE PAIEMENT -->
        <div class="grid grid-cols-3 gap-3">

            <!-- M-PESA -->
            <button
                type="button"
                @click="choosePayment('mpesa')"
                class="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all"
                :class="paymentMethod === 'mpesa'
                    ? 'border-[#004D4A] bg-[#004D4A]/5 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
            >
                <i
                    v-if="paymentMethod === 'mpesa'"
                    class="pi pi-check-circle absolute -top-2 -right-2 text-[#004D4A] bg-white rounded-full text-base"
                ></i>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/03/M-pesa-logo.png"
                    class="h-8 w-full object-contain"
                    alt="M-Pesa"
                />
                <p class="text-xs font-semibold text-slate-600">
                    M-Pesa
                </p>
            </button>

            <!-- AIRTEL -->
            

            <!-- ORANGE -->


        </div>

        <!-- FORMULAIRE MOBILE MONEY -->
        <div
            v-if="['mpesa', 'airtel', 'orange'].includes(paymentMethod)"
            class="space-y-4 animate-fadein"
        >

            <!-- NUMÉRO -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <i class="pi pi-phone text-[#004D4A]"></i>
                    Numéro de téléphone
                </label>

                <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden
                            bg-white transition-all
                            focus-within:border-[#004D4A] focus-within:ring-4 focus-within:ring-[#004D4A]/10">

                    <span class="text-sm font-bold text-[#004D4A] bg-[#004D4A]/5 px-3.5 py-3.5">
                        +243
                    </span>

                    <div class="w-px h-6 bg-slate-200"></div>

                    <input
                        v-model="phone"
                        type="tel"
                        maxlength="9"
                        inputmode="numeric"
                        placeholder="812 345 678"
                        class="flex-1 px-3.5 py-3.5 outline-none text-slate-800 font-medium bg-transparent"
                    />
                </div>

                <p class="text-xs text-slate-400 flex items-center gap-1">
                    <i class="pi pi-info-circle text-[10px]"></i>
                    9 chiffres uniquement, sans l'indicatif (+243)
                </p>
            </div>

            <!-- RÉSUMÉ -->
            <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">

                <div class="flex justify-between items-center">
                    <span class="text-sm text-slate-500">
                        Moyen de paiement
                    </span>
                    <span class="text-sm font-bold text-slate-800">
                        {{
                            paymentMethod === 'mpesa'
                                ? 'M-Pesa'
                                : paymentMethod === 'airtel'
                                    ? 'Airtel Money'
                                    : 'Orange Money'
                        }}
                    </span>
                </div>

                <div class="flex justify-between items-center mt-3">
                    <span class="text-sm text-slate-500">
                        Numéro
                    </span>
                    <span class="text-sm font-semibold text-slate-800">
                        +243 {{ phone }}
                    </span>
                </div>

                <div class="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                    <span class="font-semibold text-slate-700">
                        Total
                    </span>
                    <span class="font-bold text-xl text-[#004D4A]">
                        {{ rechargeAmount || 0 }} <span class="text-sm font-semibold">USD</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- BOUTONS -->
        <div class="flex justify-end gap-3 pt-2">

            <button
                type="button"
                @click="showRechargeDialog = false"
                class="px-5 py-2.5 rounded-xl border border-slate-200
                       text-slate-600 font-semibold transition-colors
                       hover:bg-slate-50 hover:border-slate-300"
            >
                Annuler
            </button>

            <button
                type="button"
                @click="processRecharge"
                :disabled="
                    isLoading ||
                    !rechargeAmount ||
                    !paymentMethod ||
                    phone.length !== 9
                "
                class="px-6 py-2.5 rounded-xl bg-[#004D4A] text-white
                      font-semibold shadow-sm shadow-[#004D4A]/20
                      transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed
                      disabled:shadow-none
                      hover:bg-[#003936] hover:shadow-md"
            >
                <template v-if="isLoading">
                    <i class="pi pi-spin pi-spinner mr-2"></i>
                    Traitement...
                </template>

                <template v-else>
                    <i class="pi pi-wallet mr-2"></i>
                    Recharger
                </template>
            </button>

        </div>
    </div>
</Dialog>


 <Dialog v-model:visible="showDialog" header="Modifier le Profil" :modal="true" :style="{ width: '560px' }" class="profile-dialog">
    <div class="dialog-body">
 
      <!-- Identité -->
      <div class="field field-full">
        <label class="field-label">Nom de la boutique</label>
        <InputText v-model="editedProfile.entrep_name" class="w-full" :invalid="submitted && !editedProfile.entrep_name" />
        <small v-if="submitted && !editedProfile.entrep_name" class="field-error">Ce champ est requis.</small>
      </div>
 
      <!-- Identifiants légaux -->
      <div class="field-section">
        <span class="section-label">Identifiants légaux</span>
        <div class="field-grid">
          <div class="field">
            <label class="field-label">Numéro d'impôt</label>
            <InputText v-model="editedProfile.impot_number" class="w-full" />
          </div>
          <div class="field">
            <label class="field-label">ID Nat</label>
            <InputText v-model="editedProfile.id_nat" class="w-full" />
          </div>
          <div class="field field-full">
            <label class="field-label">RCCM</label>
            <InputText v-model="editedProfile.rccm_number" class="w-full" />
          </div>
        </div>
      </div>
 
      <!-- Coordonnées -->
      <div class="field-section">
        <span class="section-label">Coordonnées</span>
        <div class="field-grid">
          <div class="field field-full">
            <label class="field-label">Téléphone</label>
            <InputText v-model="editedProfile.phone_number" class="w-full" />
          </div>
          <div class="field field-full">
            <label class="field-label">Adresse</label>
            <InputText v-model="editedProfile.adress" class="w-full" />
          </div>
        </div>
      </div>
 
      <!-- Devise -->
      <div class="field-section">
        <span class="section-label">Devise &amp; change</span>
        <div class="field-grid">
          <div class="field">
            <label class="field-label">Devise</label>
            <select v-model="editedProfile.currency_preference" class="native-select">
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Taux de change</label>
            <InputText v-model="editedProfile.exchange_rate" class="w-full" />
          </div>
        </div>
      </div>
 
      <!-- Points de fidélité -->
      <div class="field-section">
        <span class="section-label">Points de fidélité</span>
        <div class="field-grid">
          <div class="field">
            <label class="field-label">Valeur d'un point (Entrée)</label>
            <InputText v-model="editedProfile.point_entry" class="w-full mono-input" />
          </div>
          <div class="field">
            <label class="field-label">Valeur d'un point (Sortie)</label>
            <InputText v-model="editedProfile.point_output" class="w-full mono-input" />
          </div>
        </div>
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



  <SecretCodeDialog
    v-model:visible="deleteSecretKeyDialog"
    title="Vérification du code secret"
    message="Entrez votre code secret pour continuer."
    @verified="handleSecretVerification"
    @secret-code="handleSecretCode"
   
  />


  </div>
</template>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
 
/* ─────────────────── Design tokens ─────────────────── */
.settings-shell {
  --bg: #f5f6fa;
  --surface: #ffffff;
  --border: #e6e8ef;
  --border-strong: #d7dae3;
  --text: #12141c;
  --text-soft: #666b7a;
  --text-faint: #9aa0ad;
 
  --primary: #4f46e5;
  --primary-soft: #eef0fd;
  --success: #157a3d;
  --success-soft: #e9f8ef;
  --danger: #ae1f1f;
  --danger-soft: #fbeaea;
  --amber: #a15a06;
  --amber-soft: #fbf1de;
 
  --font-display: 'Manrope', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', 'Inter', monospace;
 
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1220px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  background: var(--bg);
  font-family: var(--font-body);
  color: var(--text);
}
 
.settings-shell * {
  box-sizing: border-box;
}
 
/* ─────────────────── Card shell ─────────────────── */
.settings-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px 10px 10px;
}
 
.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
 
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
 
.card-title {
  display: flex;
  align-items: center;
  gap: 14px;
}
 
.card-title h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text);
}
 
.card-subtitle {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--text-soft);
}
 
.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 16px;
}
 
.title-icon.indigo {
  background: var(--primary-soft);
  color: var(--primary);
}
 
.title-icon.amber {
  background: var(--amber-soft);
  color: var(--amber);
}
 
/* ─────────────────── Info grid ─────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 20px;
}
 
.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
 
.info-item-full {
  grid-column: 1 / -1;
}
 
.info-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
}
 
.info-value {
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 10px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}
 
.badge-green {
  background: var(--success-soft);
  color: var(--success);
}
 
.badge-red {
  background: var(--danger-soft);
  color: var(--danger);
}
 
/* ─────────────────── Loyalty section ─────────────────── */
.loyalty-section {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
 
.loyalty-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
}
 
.loyalty-header .pi {
  color: var(--amber);
  font-size: 13px;
}
 
.loyalty-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
 
.loyalty-card {
  position: relative;
  overflow: hidden;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
 
.loyalty-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-strong);
}
 
.loyalty-card:has(.loyalty-card-value.green)::before {
  background: var(--success);
}
 
.loyalty-card:has(.loyalty-card-value.red)::before {
  background: var(--danger);
}
 
.loyalty-card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 10px;
}
 
.loyalty-card-value {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
 
.loyalty-card-value.green {
  color: var(--success);
}
 
.loyalty-card-value.red {
  color: var(--danger);
}
 
.loyalty-currency {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-faint);
}
 
.loyalty-card-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 12px;
}
 
.loyalty-card-icon.red {
  background: var(--danger-soft);
  color: var(--danger);
}
 
.loyalty-card-icon.muted {
  background: #f1f2f5;
  color: var(--text-faint);
}
 
/* Toggle */
.loyalty-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
 
.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.18s ease;
}
 
.toggle-switch:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
 
.toggle-on {
  background: var(--success);
}
 
.toggle-off {
  background: #d3d6de;
}
 
.toggle-knob {
  position: absolute;
  top: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: left 0.18s ease;
}
 
.knob-on {
  left: 20px;
}
 
.knob-off {
  left: 2px;
}
 
.status-on {
  font-size: 13px;
  font-weight: 600;
  color: var(--success);
}
 
.status-off {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-faint);
}
 
/* ─────────────────── Account actions ─────────────────── */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}
 
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
}
 
.act-btn:hover {
  transform: translateY(-1px);
}
 
.act-btn:active {
  transform: translateY(0);
}
 
.act-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
 
.act-btn .pi {
  font-size: 12.5px;
}
 
.act-info {
  color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border-strong));
}
 
.act-info:hover {
  background: var(--primary-soft);
}
 
.act-danger {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 25%, var(--border-strong));
}
 
.act-danger:hover {
  background: var(--danger-soft);
}
 
.act-warning {
  color: var(--amber);
  border-color: color-mix(in srgb, var(--amber) 25%, var(--border-strong));
}
 
.act-warning:hover {
  background: var(--amber-soft);
}
 
/* ─────────────────── Subscription ─────────────────── */
.subscription-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
  background: var(--primary-soft);
  color: var(--primary);
}
 
.progress-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}
 
.progress-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
 
.progress-pct {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
 
.progress-track {
  height: 6px;
  border-radius: 999px;
  background: #edeef3;
  overflow: hidden;
}
 
.progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
 
/* ─────────────────── Responsive ─────────────────── */
@media (max-width: 860px) {
  .two-col-grid {
    grid-template-columns: 1fr;
  }
 
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
 
  .loyalty-cards {
    grid-template-columns: 1fr;
  }
}
 
@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
 
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
}
 
@media (prefers-reduced-motion: reduce) {
  .settings-shell * {
    transition: none !important;
  }
}





/* ─────────────────── modale modification ─────────────────── */

.profile-dialog {
  --primary: #4f46e5;
  --primary-soft: #eef0fd;
  --border: #e6e8ef;
  --border-strong: #d7dae3;
  --text: #12141c;
  --text-soft: #666b7a;
  --text-faint: #9aa0ad;
  --danger: #ae1f1f;
  --danger-soft: #fbeaea;
 
  --font-display: 'Manrope', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', 'Inter', monospace;
 
  font-family: var(--font-body);
}
 
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
 
.field-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
 
.section-label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}
 
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
 
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
 
.field-full {
  grid-column: 1 / -1;
}
 
.field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}
 
.field-error {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--danger);
}
 
.mono-input :deep(input) {
  font-family: var(--font-mono);
}
 
.native-select {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: #fff;
  font-family: var(--font-body);
  font-size: 13.5px;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s ease;
}
 
.native-select:hover {
  border-color: var(--primary);
}
 
.native-select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}
 
/* PrimeVue overrides, scoped to this dialog only */
.profile-dialog :deep(.p-dialog-header) {
  font-family: var(--font-display);
  font-weight: 700;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
 
.profile-dialog :deep(.p-dialog-content) {
  padding: 20px 22px;
}
 
.profile-dialog :deep(.p-dialog-footer) {
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
 
.profile-dialog :deep(.p-inputtext) {
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  font-size: 13.5px;
  transition: border-color 0.15s ease;
}
 
.profile-dialog :deep(.p-inputtext:enabled:hover) {
  border-color: var(--primary);
}
 
.profile-dialog :deep(.p-inputtext:enabled:focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
 
.profile-dialog :deep(.p-inputtext.p-invalid) {
  border-color: var(--danger);
}
 
@media (max-width: 480px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>