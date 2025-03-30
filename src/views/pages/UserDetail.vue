vue
<script setup>
import { createdSubscription, fetchUserById } from '@/service/Api';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const user = ref(null);
const subscriptionData = ref({
    user:null,
    amount:null,
    end_date:null
});

const subscriptionDialog = ref(false); // Correctly defined as a ref
const submitted = ref(false);

onMounted(async () => {
    userRouter();
});
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
    subscriptionDialog.value = true; // Use .value to update the ref
}
async function saveSubscription(){

    submitted.value = true;
    try{
        const response = await createdSubscription(subscriptionData.value);
        console.log('Subscription created successfully :', response);
        subscriptionData.value.amount =null;
        subscriptionData.value.end_date =null;
    } catch(error){
        console.log('Error creating subscription :', error);
    }
    
    
}


</script>
<template>
   <div>
      <div class="card">
        <Toolbar class="mb-6">
          <template #start v-if="user !== null && user.username">
              <h1 class="text-1xl font-bold text-gray-800 mr-2">
                  <i class="pi pi-user mr-2" style="font-size: 2.1rem"></i>
                  {{ user.username }}
              </h1>
          </template>
          <template #end>
              <Button label="Modifier" severity="warn" class="mr-2"/>
              <Button label="Abonnement" class="mr-2" @click="openNew"/> <!-- Corrected function call -->
              <Button label="Supprimer le compte" severity="danger" class="mr-2" />
          </template>
        </Toolbar>
    </div>
    <Dialog v-model:visible="subscriptionDialog" :style="{ width: '450px' }" header="Recharge Abonnement" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-3"> Client:  {{ user.username }}</label>
               
            </div>
            <div class="grid grid-cols-12 gap-4">

                <div class="col-span-6">
                    <label for="puchase_price" class="block font-bold mb-3">Balance $</label>
                    <InputNumber 
                    id="puchase_price" 
                       mode="currency"
                       currency="CDF"
                       locale="en-US"
                       v-model="subscriptionData.amount" 
                       fluid           
                     />
                </div>

                <div class="col-span-6">
                    <label for="date" class="block font-bold mb-3">fin d'abonnement</label>
                    <Calendar 
                            id="date" 
                            class="w-full" 
                            :showIcon="true" 
                            dateFormat="mm/dd/yy" 
                            v-model="subscriptionData.end_date"
                        />
                </div>

            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text />
            <Button label="Save" icon="pi pi-check" @click="saveSubscription" />
        </template>
    </Dialog>
   </div>
</template>