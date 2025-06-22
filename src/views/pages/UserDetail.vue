vue
<script setup>
import { createdSubscription, fecthSubscriptionByUserId, fetchUserById, fetchUserProfilById, updateSubscription } from '@/service/Api';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const user = ref(null);
const subscription = ref(null); 
const isEditMode = ref(false);
const userProfile = ref(null);

const subscriptionTypes =[
    {label: 'Basic', value: 'BASIC'},
    {label :'Medium', value: 'MEDIUM'},
    {label: 'Premium', value: 'PREMIUM'},
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
            <div class="card flex flex-col gap-4 w-full">
                <div class="font-semibold text-xl">Information sur l'abonnement</div>
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="firstname2">Type d'abonnement: </label>
                        <h2 class="font-bold p-2">{{ subscription? subscription.subscription_type : 'No definie' }} </h2>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="lastname2">Montant: </label>
                        <h2 class="font-bold p-2">  {{ subscription ? subscription.amount + ' ' : 'Non défini' }} $</h2>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="lastname2">Fin d'adbonnement: </label>
                        <h2 class="font-bold p-2"> {{ subscription? new Date(subscription.end_date).toLocaleDateString():'No definie' }}</h2>
                    </div>
                </div>
                <div class="font-semibold text-xl">Detail sur l'entreprise</div>
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="">Nom l'entreprise:</label>
                        <h1 class="font-bold p-2"> {{ userProfile? userProfile.entrep_name :'No definie'}}</h1>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for=""> Téléphone: </label>
                        <h2 class="font-bold p-2"> {{ userProfile?  userProfile.phone_number : 'No definie' }}</h2>
                    </div> 
                    
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for="">Adresse: </label>
                        <h1 class="font-bold p-2"> {{ userProfile? userProfile.adress :'No definie'}}</h1>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for=""> RCCM:</label>
                        <h2 class="font-bold p-2">{{ userProfile? userProfile.rccm_number : 'No definie' }}</h2>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for=""> Numero Impôt:</label>
                        <h2 class="font-bold p-2">{{ userProfile? userProfile.impot_number : 'No definie' }}</h2>
                    </div>
        
               </div>
               <div class="font-semibold text-xl">Detail sur l'utilisateur</div>
               <div class="flex flex-col md:flex-row gap-4">
                 
                    <div class="flex flex-wrap gap-2 w-full">
                        <label for=""> Utilisateur:</label>
                        <h2 class="font-bold p-2">{{ user? user.username :'No definie'}}</h2>
                    </div>

                    <div class="flex flex-wrap gap-2 w-full">
                        <label for=""> Email:</label>
                        <h2 class="font-bold p-2">{{user? user.email :'No definie'}}</h2>
                    </div>


                
               </div>
            </div>
        </div>
    </Fluid>
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
    </div>
  </template>
  