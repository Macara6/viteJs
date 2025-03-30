

<script setup>
import { fetchSubscription, fetchUsers } from '@/service/Api';
import {FilterMatchMode} from '@primevue/core'
import { onMounted, ref } from 'vue';

const subscriptions = ref([]);
const subscription = ref({});
const users = ref({});

onMounted( async () => {
    await loadSubscriptionAndUser();
});

async function loadSubscriptionAndUser(){
    try{
        const [fetchedSubscriptions,fetchedUsers] = await Promise.all([fetchSubscription(), fetchUsers()]);
        console.log('Feched Subscriptions:', fetchedSubscriptions);
        console.log('Fetched Users:', fetchedUsers);

        users.value = fetchedUsers.reduce((acc, user) => {
            acc[user.id] = user.username;
        
            return acc;
        }, {});

        subscriptions.value = fetchedSubscriptions.map(subscription => {
             
          
            const user_name = users.value[subscription.user];

          
            console.log(`Subscription name: ${user_name}, expiration date: ${subscription.end_date}`);

            return {
                ...subscription,
                user_name
            };
        })
    }catch(error){
        console.error("errer d'affichage d'abonnements:", error);
    }
}
function formatDate(value){

    const options = {
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        hour12:false,
    };
    const date = new Date(value);
    return date.toLocaleDateString('sv-SE', options).replace(' ',' |  ');

}


function getStatus(end_date){
    const today = new Date();
    const endDate = new Date(end_date);

    return endDate <= today ? 'Expired': 'Active'; 

}
function getStatusClass(end_date){
    return getStatus(end_date) === 'Expired' ? 'text-red-500': 'text-green-500';

}
function formaPrice(price){
    if(price !== null && price !== undefined){
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}





</script>

<template>
   <div class="card">
     <div class="font-semibold text-xl mb-4"> Abonnements</div>
     <DataTable
     :value="subscriptions"
            :paginator="true"
            :rows="10"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters1"
            filterDisplay="menu"
            :loading="loading1"
            :filters="filters1"
            :globalFilterFields="['name', 'country.name', 'representative.name', 'balance', 'status']"
            showGridlines
       >
     <template #header>
        <div class="flex justify-between">
            <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="" />
            <IconField>
                <InputIcon>
                     <i class="pi pi-search" />
                    </InputIcon>
                <InputText   placeholder="Keyword Search" />
            </IconField>
        </div>
     </template>
     <Column field="user_name" header="Client" style="min-width: 12rem"></Column>
     <Column field="start_date" header="Date d'activation">
        <template #body = "slotProps">
                {{ formatDate(slotProps.data.start_date) }}
        </template>
     </Column>
     <Column field="end_date" header="Date d'expiration">
        <template #body = "slotProps">
                    {{ formatDate(slotProps.data.end_date) }}
        </template>
     </Column>
     <Column field="amount" header="Balace">
        <template #body="slotProps">
                {{formaPrice(slotProps.data.amount) }} $
        </template>   
     </Column>
    <Column field="en_date" header="Abonnement" style="min-width: 200px">
       <template #body ="slotProps">
        <span :class="getStatusClass(slotProps.data.end_date)">
            {{ getStatus(slotProps.data.end_date) }}
        </span>
       </template>
    </Column>

    <Column field="is_active" header="Verified" dataType="boolean" bodyClass="text-center" style="min-width: 8rem">
            <template #body="{ data }">
                <i class="pi" :class="{ 'pi-check-circle text-green-500 ': data.verified, 'pi-times-circle text-red-500': !data.verified }"></i>
            </template>    
    </Column>     

     </DataTable>
   </div>


</template>