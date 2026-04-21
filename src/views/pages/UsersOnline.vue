
<script setup>
import { fetchUsersOnlineAPI } from '@/service/Api';
import { onMounted, ref } from 'vue';



const onlineUsers = ref([]);
const filters = ref({
    global: { value: null }
});

function getSeverity(status) {
    switch (status) {
        case 'ADMIN': return 'danger';
        case 'CAISSIER': return 'info';
        case 'GESTIONNAIRE_STOCK': return 'warning';
        default: return null;
    }
}

async function getOnlineUsers() {
    try{
        const response = await fetchUsersOnlineAPI();
        onlineUsers.value = response;
        console.log('utilisateur connecter :', response);
    }catch(error){
        console.error('error to fetch online users :', error);
    }
    
}
function formatDate(date) {
    return new Date(date).toLocaleString();
}

onMounted(async () => {
   getOnlineUsers();
   setInterval(getOnlineUsers, 10000);

});


</script>
<template>
    <div class="card">
        <h2 class="mb-3">🟢 Utilisateurs connectés</h2>

        <!--  Recherche -->
        <div class="flex justify-content-between mb-3">
            <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters.global.value" placeholder="Rechercher..." />
            </span>

            <span class="count">
                {{ onlineUsers.length }} en ligne
            </span>
        </div>

        <!-- 📊 Table -->
        <DataTable
            :value="onlineUsers"
            paginator
            :rows="5"
            :filters="filters"
            filterDisplay="row"
            responsiveLayout="scroll"
            stripedRows
        >

            <!-- 👤 Utilisateur -->
            <Column header="Utilisateur">
                <template #body="slotProps">
                    <div class="flex align-items-center gap-2">
                        <Avatar
                            :label="slotProps.data.username.charAt(0).toUpperCase()"
                            shape="circle"
                            style="background-color:#4CAF50;color:white"
                        />
                        <span>{{ slotProps.data.username }}</span>
                    </div>
                </template>
            </Column>

            <!--  Rôle -->
            <Column field="status" header="Rôle" sortable>
                <template #body="slotProps">
                    <Tag
                        :value="slotProps.data.status"
                        :severity="getSeverity(slotProps.data.status)"
                    />
                </template>
            </Column>

            <!-- Statut -->
            <Column header="Statut">
                <template #body="slotProps">
                    <Tag value="En ligne" severity="success" />
                </template>
            </Column>

            <Column field="ip_address" header="IP">
        
            </Column>
            <Column field="device_info" header="Systèmes d'exploitation">
        
            </Column>
            <!-- Activité -->
            <Column header="Dernière activité" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.last_activity) }}
                </template>
            </Column>

        </DataTable>
    </div>
</template>

<style scoped>
.card {
    padding: 20px;
}

.count {
    font-weight: bold;
    color: #4CAF50;
}
</style>