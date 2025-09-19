<script setup>
import { fetchSubscription, fetchUsers, reactivateSubscription } from '@/service/Api';
import { FilterMatchMode } from '@primevue/core';
import { onMounted, ref } from 'vue';

const subscriptions = ref([]);
const subscription = ref({});

const loading1 = ref(false);
const users = ref({});
const filters1 = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
onMounted(async () => {
   
    await loadSubscriptionAndUser();
});

async function loadSubscriptionAndUser() {
    try {
        const [fetchedSubscriptions, fetchedUsers] = await Promise.all([
            fetchSubscription(),
            fetchUsers()
        ]);

        const currentUserId = localStorage.getItem('id');
        const isCurrentUserSuperuser = localStorage.getItem('is_superuser') === 'true';
        let filteredUsers = fetchedUsers;

        if (isCurrentUserSuperuser && currentUserId) {
            filteredUsers = fetchedUsers.filter(
                user => String(user.id) !== String(currentUserId)
            );
        }

        users.value = filteredUsers.reduce((acc, user) => {
            acc[user.id] = user.username;
            return acc;
        }, {});

        subscriptions.value = fetchedSubscriptions
            .filter(subscription => users.value[subscription.user])
            .map(subscription => {
                const user_name = users.value[subscription.user];
                return {
                    ...subscription,
                    user_name
                };
            });

    } catch (error) {
        console.error("Erreur d'affichage des abonnements:", error);
    }
}

async function handleReativate(subscription) {
    try {
        await reactivateSubscription(subscription.user);
        await loadSubscriptionAndUser();
    } catch (error) {
        console.error("Erreur lors de la réactivation :", error);
        alert("Échec de réactivation");
    }
}

function formatDate(value) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const date = new Date(value);
    return date.toLocaleDateString('sv-SE', options).replace(' ', ' | ');
}

function getStatus(end_date) {
    const today = new Date();
    const endDate = new Date(end_date);
    return endDate <= today ? 'Expiré' : 'Actif';
}

function getStatusClass(end_date) {
    return getStatus(end_date) === 'Expiré' ? 'text-red-500' : 'text-green-500';
}

function formaPrice(price) {
    if (price !== null && price !== undefined) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}


function clearFilter() {
  filters1.value.global.value = null;
}
</script>

<template>
   <div class="card">
     <div class="font-semibold text-xl mb-4">ABONNEMENTS</div>

     <DataTable
        :value="subscriptions"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters1"
        filterDisplay="menu"
        :loading="loading1"
        :globalFilterFields="['user_name','subscription_type','amount']"
        showGridlines
     >
        <template #header>
            <div class="flex justify-between">
                <Button 
                    type="button" 
                    icon="pi pi-filter-slash" 
                    label="Clear"   
                    @click="clearFilter"  
                />
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText 
                        v-model="filters1.global.value"
                        placeholder="Filtre" 
                    />
                </IconField>
            </div>
        </template>

        <Column field="user_name" header="CLIENT" style="min-width: 12rem"></Column>

        <Column field="start_date" header="DATE D'ACTIVATION">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.start_date) }}
            </template>
        </Column>

        <Column field="end_date" header="DATE D'EXPIRATION">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.end_date) }}
            </template>
        </Column>

        <Column field="amount" header="DEVISE">
            <template #body="slotProps">
                {{ formaPrice(slotProps.data.amount) }} USD
            </template>
        </Column>

        <Column field="end_date" header="STATUS" style="min-width: 50px">
            <template #body="slotProps">
                <span :class="getStatusClass(slotProps.data.end_date)">
                    {{ getStatus(slotProps.data.end_date) }}
                </span>
            </template>
        </Column>

        <Column field="subscription_type" header="TYPE" bodyClass="text-center" style="min-width: 8rem">
            <template #body="slotProps">
                <span 
                    :class="[
                      'px-2 py-1 rounded text-white text-sm font-semibold',
                      {
                        'bg-green-500': slotProps.data.subscription_type === 'BASIC',
                        'bg-orange-500': slotProps.data.subscription_type === 'MEDIUM',
                        'bg-purple-600': slotProps.data.subscription_type === 'PREMIUM'
                      }
                    ]"
                >
                    {{ slotProps.data.subscription_type }}
                </span>
            </template>    
        </Column>

        <Column header="ACTION" bodyClass="text-center" style="min-width: 8rem">
            <template #body="slotProps">
                <Button 
                    label="Réactiver"
                    icon="pi pi-refresh"
                    class="p-button-sm p-button-success"
                    @click="handleReativate(slotProps.data)"
                    v-if="getStatus(slotProps.data.end_date) === 'Expiré'"
                />
            </template>
        </Column>
     </DataTable>
   </div>
</template>
