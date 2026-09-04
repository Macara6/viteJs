vue
<script setup>
import {
  createdSubscription,
  fecthSubscriptionByUserId,
  fetchUserById,
  fetchUserForId,
  fetchUserProfilById,
  rechargeManuelAPI,
  updateSubscription
} from '@/service/Api';
import { statusCheck } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const toast = useToast();
const route = useRoute();
const user = ref(null);
const subscription = ref(null); 
const isEditMode = ref(false);
const userProfile = ref(null);
const usersforMyIds = ref([]); 

const subscriptionTypes =[
    {label: 'Basic', value: 'BASIC'},
    {label :'Medium', value: 'MEDIUM'},
    {label: 'Premium', value: 'PREMIUM'},
    {label: 'Platinum', value:'PLATINUM'},
    {label: 'Diamond', value:'DIAMOND'},
]

const subscriptionData = ref({
    user:null,
    amount:null,
    end_date:null,
    subscriptionTypes:null
});


const subscriptionDialog = ref(false); // Correctly defined as a ref
const submitted = ref(false);


onMounted(async () => {
    userRouter();
    fetchUserSubscription();
    fetchUserProfile();
    fetchUserForMyId();

});


async function fetchUserProfile(){
    const userId = route.params.id;

    try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        console.log('Profil utilisateur récupéré :', result);
    } catch(error){
        console.error('Erreur lors de la récupération du profil utilisateur :', error);
        userProfile.value = null;
    }
}
async function fetchUserForMyId(){
  const userId = route.params.id;
  try{
    const  response = await fetchUserForId(userId);
    usersforMyIds.value = response
    console.log('Les utilisateur de ce client :', usersforMyIds.value);
  }catch(error){
     
  }
}

async  function fetchUserSubscription(){
    try {
        const userId = route.params.id;
        const result = await fecthSubscriptionByUserId(userId);
        subscription.value = result;
        console.log('Abonnement :', result);
        if (result){
            subscriptionData.value = {
            user: result.user,
            amount: result.amount,
            end_date: new Date(result.end_date),
            subscription_type: result.subscription_type
            };
            isEditMode.value= true;
        }

    } catch(error){
        console.error('Erreur abonnement utilisateur:', error);
    }
}

async function userRouter() {
    const userId = route.params.id;
    try {
        user.value = await fetchUserById(userId);
        subscriptionData.value.user = user.value.id;
        console.log('Fetching User:', user.value);
        console.log('Username:', user.value?.username);
    } catch (error) {
        console.error('Error fetching User', error);
        user.value = null;
    }
}
function openNew() { // Corrected function name
    subscriptionDialog.value = true;// Use .value to update the ref

    if(subscription.value){

        isEditMode.value = true;
        subscriptionData.value = {
        user: subscription.value.user,
        amount: subscription.value.amount,
        end_date: new Date(subscription.value.end_date),
        subscription_type: subscription.value.subscription_type
        };
    } else{

        isEditMode.value = false;
        subscriptionData.value = {
        user: user.value?.id,
        amount: null,
        end_date: null,
        subscription_type: null,
        };
    }
  
}



async function saveSubscription(){
    submitted.value = true;
    const userId  = route.params.id;

    try{
        let response;
        if(isEditMode.value){
            response = await updateSubscription(userId, subscriptionData.value);
            console.log('Abonnement mis à jour :', response);
        }else {
            response = await createdSubscription(subscriptionData.value);
            console.log('Abonnement créé :', response);
        }
        subscriptionDialog.value = false;
        fetchUserSubscription();
        subscriptionData.value.amount =null;
        subscriptionData.value.end_date =null;
        subscriptionData.value.subscription_type = null;
        isEditMode.value = false;
    } catch(error){
        console.log('Error creating subscription :', error);
    }
    
}

const showRechargeDialog = ref(false);
const isLoading = ref(false);
const rechargeAmount = ref('');
const paymentMethod = ref('') 

const choosePayment = (method) => {
  paymentMethod.value = method 

}


const processRecharge = async () =>{
  
  if(!rechargeAmount.value) return;
  if(!paymentMethod.value) return;
  
  const data = {
    user:user.value.id,
    amount:rechargeAmount.value,
    provider: paymentMethod.value
  }

  try{
    isLoading.value = true;
    const response = await rechargeManuelAPI(data)
     user.value.balance = response.new_balance;
     showRechargeDialog.value = false
      toast.add({ severity: 'success', summary: 'Succès', detail: 'recharge a été enregistrée avec succès', life: 3000 });

  }catch(error){

    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 });
  }finally{
    isLoading.value = false;
  }

}





</script>
<template>
    <div>
      <!-- Carte principale -->
      <div class="card p-6 shadow-md rounded-xl bg-white">
        <Toolbar class="mb-4">
          <template #start v-if="user && user.username">
            <h1 class="text-2xl font-semibold text-gray-800 flex items-center">
              <i class="pi pi-user mr-2 text-3xl text-primary" />
              {{ user.username }}
            </h1>
          </template>
          <template #end>
            <Button label="Modifier" severity="warn" class="mr-2" />
            <Button label="Abonnement" class="mr-2" @click="openNew" />
            <Button label="Supprimer le compte" severity="danger" class="mr-2" />
          </template>
        </Toolbar>
  
        <!-- Détails de l'abonnement -->

      </div>

    <Fluid>
      <div class="flex mt-8">
        <div class="w-full flex flex-col gap-6">

          <!-- BALANCE — mise en avant -->
          <div class="rounded-2xl bg-gradient-to-br from-[#004D4A] to-[#00615c] p-6 shadow-lg shadow-[#004D4A]/20">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10">
                  <i class="pi pi-wallet text-xl text-white"></i>
                </div>
                <div>
                  <p class="text-xs font-medium text-white/60 uppercase tracking-wide">Balance disponible</p>
                  <p class="text-2xl font-bold text-white mt-0.5">
                    {{ user?.balance ?? 0 }} <span class="text-base font-semibold text-white/70">USD</span>
                  </p>
                </div>
              </div>
              <Button
                label="Recharger"
                icon="pi pi-plus"
                class="!bg-white !text-[#004D4A] !border-none !font-semibold hover:!bg-white/90"
                @click="showRechargeDialog = true"
              />
            </div>
          </div>

          <!-- ABONNEMENT -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600">
                <i class="pi pi-verified text-sm"></i>
              </div>
              <h3 class="font-semibold text-lg text-slate-900">Information sur l'abonnement</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Type d'abonnement</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ subscription ? subscription.subscription_type : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Montant</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ subscription ? subscription.amount + ' $' : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Fin d'abonnement</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ subscription ? new Date(subscription.end_date).toLocaleDateString() : 'Non défini' }}
                </span>
              </div>
            </div>
          </div>

          <!-- ENTREPRISE -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 text-amber-600">
                <i class="pi pi-briefcase text-sm"></i>
              </div>
              <h3 class="font-semibold text-lg text-slate-900">Détail sur l'entreprise</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Nom de l'entreprise</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ userProfile ? userProfile.entrep_name : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Téléphone</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ userProfile ? userProfile.phone_number : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Adresse</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ userProfile ? userProfile.adress : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">RCCM</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ userProfile ? userProfile.rccm_number : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Numéro Impôt</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ userProfile ? userProfile.impot_number : 'Non défini' }}
                </span>
              </div>
            </div>
          </div>

          <!-- UTILISATEUR -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                <i class="pi pi-user text-sm"></i>
              </div>
              <h3 class="font-semibold text-lg text-slate-900">Détail sur l'utilisateur</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Utilisateur</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ user ? user.username : 'Non défini' }}
                </span>
              </div>

              <div class="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</span>
                <span class="text-sm font-semibold text-slate-900">
                  {{ user ? user.email : 'Non défini' }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Fluid>

    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="p-3 text-left"> ID Compte</th>
              <th class="p-3 text-left">Nom d'utilisateur</th>
              <th class="p-3 text-left">Nom & Post-Nom</th>
              <th class="p-3 text-left">Crée par</th>
              <th class="p-3 text-left">email</th>
              <th class="p-3 text-left">Rôle</th>
              <th class="p-3 text-left">Status</th>
            </tr>
        </thead>
        <tbody>
        <tr
          v-for="u in usersforMyIds"
          :key="u.id"
          class="border-t hover:bg-gray-50"
        >
          <td class="p-3 text-blue-600 font-semibold">
            {{ u.custom_account_id }}
          </td>
          
           <td class="p-3 flex items-center gap-2">
              {{ u.username }}
           </td>
          <td class="p-3 font-semibold text-blue-600">
            {{ u.first_name }} {{ u.last_name }} 
          </td>
          <td class="p-3 font-semibold text-green-600">
            {{ u.user_created_name }}  
          </td>
          <td class="p-3 font-semibold text-blue-600">
            {{ u.email }} 
          </td>
          <td class="p-3 font-semibold text-blue-600">
            {{ u.status }} 
          </td>
          
          <td class="p-3 font-semibold ">
            <div :class="[
               {
               'text-green-500':u.is_blocked === false,
               'text-orange-600':u.is_blocked ===true
               }
            ]">
             {{ statusCheck( u.is_blocked )}}
            </div>
          </td>

        </tr>

        </tbody>
      </table>
    </div>








      <!-- Dialog pour l'abonnement -->
      <Dialog v-model:visible="subscriptionDialog" :style="{ width: '500px' }" header="Recharge Abonnement" :modal="true" class="p-4">
        <div class="flex flex-col gap-5">
          <div>
            <label class="block font-semibold text-gray-700">Client :</label>
            <p class="text-lg font-medium text-primary mt-1">{{ user.username }}</p>
          </div>
  
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-6">
              <label for="amount" class="block font-semibold mb-1">Montant (USD)</label>
              <InputNumber 
                id="amount" 
                mode="currency"
                currency="USD"
                locale="en-US"
                v-model="subscriptionData.amount" 
                class="w-full"
              />
            </div>
  
            <div class="col-span-6">
              <label for="end_date" class="block font-semibold mb-1">Date de fin</label>
              <Calendar 
                id="end_date" 
                class="w-full" 
                :showIcon="true" 
                dateFormat="mm/dd/yy" 
                v-model="subscriptionData.end_date"
              />
            </div>
          </div>
  
          <div>
            <label for="subscription_type" class="block font-semibold mb-1">Type d'abonnement</label>
            <Dropdown 
              id="subscription_type" 
              class="w-full"
              :options="subscriptionTypes" 
              optionLabel="label"
              optionValue="value"
              v-model="subscriptionData.subscription_type"
              placeholder="Choisir un type"
            />
          </div>
        </div>
  
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="subscriptionDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="saveSubscription" />
        </template>
      </Dialog>

     

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
                    Recharge de la  balance
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
                @click="choosePayment('bilasol-pay')"
                class="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all"
                :class="paymentMethod === 'bilasol-pay'
                    ? 'border-[#004D4A] bg-[#004D4A]/5 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
            >
                <i
                    v-if="paymentMethod === 'bilasol-pay'"
                    class="pi pi-check-circle absolute -top-2 -right-2 text-[#004D4A] bg-white rounded-full text-base"
                ></i>
                <img
                    src="/demo/bila_icon_512.png"
                    class="h-16 w-full object-contain"
                    alt="M-Pesa"
                />
                <p class="text-xs font-semibold text-slate-600">
                   bilasol-pay
                </p>
            </button>

            <!-- AIRTEL -->
            

            <!-- ORANGE -->


        </div>

        <!-- FORMULAIRE MOBILE MONEY -->
        <div
            v-if="['bilasol-pay'].includes(paymentMethod)"
            class="space-y-4 animate-fadein"
        >

            <!-- NUMÉRO -->
          
          <!-- RÉSUMÉ -->
            <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">

                <div class="flex justify-between items-center">
                    <span class="text-sm text-slate-500">
                        Moyen de paiement
                    </span>
                    <span class="text-sm font-bold text-slate-800">
                        {{
                            paymentMethod === 'bilasol-pay'
                                ? 'bilasol-pay'
                                : paymentMethod === 'airtel'
                                    ? 'Airtel Money'
                                    : 'Orange Money'
                        }}
                    </span>
                </div>

                <div class="flex justify-between items-center mt-3">
                    <span class="text-sm text-slate-500">
                      client
                    </span>
                    <span class="text-sm font-semibold text-slate-800">
                         {{ user.username }}
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
                    !paymentMethod 
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










    </div>
  </template>
  