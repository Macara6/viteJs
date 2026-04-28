
<script setup>
import { fetchConnectionHistory, fetchUsersOnlineAPI } from '@/service/Api';
import { computed, onMounted, ref } from 'vue';



const onlineUsers = ref([]);
const onlineHistorys = ref([]);
const historyDialog = ref(false);
const filters = ref({
    global: { value: null }
});

const histofil = ref({
  global: { value: null, matchMode: 'contains' }
});

const connectionDate = ref(null);
const disconnectionDate = ref(null);


const fileterdHistory = computed(() => {
    return onlineHistorys.value.filter( item =>{
        const connDate = item.connection_time ? new Date(item.connection_time) : null;
        const disconnDate = item.disconnection_time ? new Date(item.disconnection_time): null;

        if( connectionDate.value){
            const selected = new Date(connectionDate.value);
            if(!connDate || connDate.toDateString() !== selected.toDateString()){
                return false;
            }
        }
        if(disconnectionDate.value){
            const selected = new Date(disconnectionDate.value);
            if(!disconnDate || disconnDate.toDateString() !== selected.toDateString()){
                return false;
            }
        }
       return true;
    })
});

function resetDates(){
    connectionDate.value = null;
    disconnectionDate.value = null;
}


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
       
    }catch(error){
        console.error('error to fetch online users :', error);
    }
    
}

async function getOnlineHistory() {
    try{
        const response = await fetchConnectionHistory();
        onlineHistorys.value = response;
        console.log('historique de connexion :', onlineHistorys.value)
    }catch(error){
        console.error('error to fetch history connection :', error)
    }
}


function formatDate(date) {
    if(!date) return 'connecté';
    return new Date(date).toLocaleString();
}

onMounted(async () => {
   getOnlineUsers();
   setInterval(getOnlineUsers, 10000);
   getOnlineHistory();

});


</script>
<template>
    <div class="card">
        <h2 class="mb-3">🟢 Utilisateurs connectés</h2>

        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">

        <!-- 🔍 Recherche -->
        <div class="flex items-center gap-2">
            <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText 
                v-model="filters.global.value" 
                placeholder="Rechercher..." 
                class="w-64"
            />
            </span>
        </div>

        <!-- Compteur -->
        <div class="text-sm text-green-900">
            {{ onlineUsers.length }} en ligne
        </div>

        <!--  Bouton -->
        <div>
            <Button 
            label="Historique" 
            icon="pi pi-history" 
            severity="secondary"
            class="px-4 py-2"
            @click="historyDialog = true"
            />
        </div>

        </div>
       

        <!--  Table -->
        <DataTable
            :value="onlineUsers"
            paginator
            :rows="10"
            :filters="filters"
            filterDisplay="row"
            responsiveLayout="scroll"
            stripedRows
        >

            <!-- Utilisateur -->
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

        <!---  Modale pour afficher l'historique de connection ---->

        <Dialog 
           v-model:visible="historyDialog" 
            :modal="true"
            header="Historique"
            :style="{ width: '800px' }"
            class="p-0"
        >
         <div class="card">
            <h2 class="mb-4">Historique de connexion</h2>
             <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                <!-- 🔍 Recherche -->
                <div class="flex items-center gap-2">
                    <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText 
                        v-model="histofil.global.value" 
                        placeholder="Rechercher..." 
                        class="w-40"
                    />
                    </span>
                </div>
            
            
                <Calendar v-model="connectionDate" placeholder="Dernière connexion " date-format="yy-mm-dd" show-icon />
                <Calendar v-model="disconnectionDate" placeholder="Dernière déconnexion" date-format="yy-mm-dd" show-icon />
                <Button label="Réinitialiser" icon="pi pi-refresh" class="p-button-outlined" @click="resetDates" />
          

             </div>

          
            <DataTable
            :value="fileterdHistory"
            paginator
            :rows="10"
            scrollable
            :filters="histofil"
            filterDisplay="row"
            :globalFilterFields="['user_name', 'ip_address', 'device_info']"
            scrollHeight="400px"
            :tableStyle="{ minWidth: '900px' }"
            stripedRows
            >

            <template #empty>
                <span class="text-gray-400 ">Aucun historique trouvé</span>
            </template>

            <Column header="Utilisateur">
                <template #body="slotProps">
                    <div class="flex align-items-center gap-2">
                        <Avatar
                            :label="slotProps.data.user_name.charAt(0).toUpperCase()"
                            shape="circle"
                            style="background-color:#4CAF50;color:white"
                        />
                        <span>{{ slotProps.data.user_name }}</span>
                    </div>
                </template>
            </Column>
             <Column field="status" header="Rôle" sortable>
                <template #body="slotProps">
                    <Tag
                        :value="slotProps.data.user_role"
                        :severity="getSeverity(slotProps.data.user_role)"
                    />
                </template>
            </Column>
            <Column field="device_info" header="Systèmes d'exploitation" />
    
            <Column field="ip_address" header="IP"></Column>

            <Column header="Dernière connexion" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.connection_time) }}
                </template>
            </Column>
            
            <Column header="Dernière déconnexion" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.disconnection_time) }}
                </template>
            </Column>
             
             

           

             </DataTable>
          </div>
    
        </Dialog>





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