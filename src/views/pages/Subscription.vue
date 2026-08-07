<script setup>
import { deleteSubscriptionAPI, fetchSubscription, fetchUsers, reactivateSubscription } from '@/service/Api';
import { checkSubMod, formatPrice } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const subscriptions = ref([]);
const subscription = ref({});

const loading1 = ref(false);
const users = ref({});
const filters1 = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const deletelDialog = ref(false); 

const subscriptionTodelete = ref(null); 
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

function confirmDelete(subscription){
    subscriptionTodelete.value = subscription;
    deletelDialog.value = true;
}


async function deleteSubscription(){
    try{
       const response =  await deleteSubscriptionAPI(subscriptionTodelete.value.user)
        await loadSubscriptionAndUser();
        if(response.status == 200){
            toast.add({ severity: 'info', summary: 'Info Message', detail: 'Abonnement Supprimée', life: 3000 });  
        }
        deletelDialog.value = false;
    }catch(error){
        
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

const filterdSubscription  = computed(() => {
    return subscriptions.value
        .filter(sub => sub.is_free_frial == false)
})


function getStatusClass(end_date) {
    return getStatus(end_date) === 'Expiré' ? 'text-red-500' : 'text-green-500';
}




function clearFilter() {
  filters1.value.global.value = null;
}


// Fonction purement visuelle (initiales pour l'avatar) — n'affecte aucune logique existante
function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}


</script>



<template>
  <div class="w-full">

    <!-- Bandeau de synthèse -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <div class="stat-card">
        <span class="stat-label">Total abonnements</span>
        <span class="stat-value text-slate-900">{{ subscriptions.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Actifs</span>
        <span class="stat-value text-emerald-600">
          {{ subscriptions.filter(s => getStatus(s.end_date) !== 'Expiré').length }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Expirés</span>
        <span class="stat-value text-red-500">
          {{ subscriptions.filter(s => getStatus(s.end_date) === 'Expiré').length }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Revenu cumulé</span>
        <span class="stat-value text-slate-900 tabular-nums">

         
            {{
            formatPrice(
                Math.round(
                filterdSubscription.reduce(
                    (sum, s) => sum + Number(s.amount || 0),
                    0
                ) * 100
                ) / 100
            )
            }}

           
          <span class="text-xs font-medium text-slate-400">USD</span>
        </span>
      </div>
    </div>

    <!-- Carte principale -->
    
<div class="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden">
 
  <!-- En-tête de la carte -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
    <div>
      <h2 class="text-lg font-semibold text-slate-900 tracking-tight">Abonnements</h2>
      <p class="text-sm text-slate-500 mt-0.5">Suivi et gestion des abonnements clients</p>
    </div>
 
    <div class="flex items-center gap-2 w-full sm:w-auto">
      <IconField class="w-full sm:w-72">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText
            v-model="filters1.global.value"
            placeholder="Rechercher un client, un type…"
            class="!w-full !text-sm"
        />
      </IconField>
      <Button
          type="button"
          icon="pi pi-filter-slash"
          outlined
          v-tooltip.top="'Réinitialiser les filtres'"
          class="!text-sm !px-3 shrink-0"
          @click="clearFilter"
      />
    </div>
  </div>
 
  <DataTable
     :value="subscriptions"
     :paginator="true"
     :rows="10"
     :rowsPerPageOptions="[10, 20, 50]"
     dataKey="id"
     :rowHover="true"
     v-model:filters="filters1"
     filterDisplay="menu"
     :loading="loading1"
     :globalFilterFields="['user_name','subscription_type','amount']"
     removableSort
     sortField="start_date"
     :sortOrder="-1"
     responsiveLayout="scroll"
     class="subs-table"
     paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
     currentPageReportTemplate="{first} à {last} sur {totalRecords}"
  >
    <template #empty>
      <div class="flex flex-col items-center gap-2 py-14 text-slate-400">
        <i class="pi pi-inbox text-2xl"></i>
        <span class="text-sm">Aucun abonnement ne correspond à votre recherche.</span>
      </div>
    </template>
 
    <template #loading>
      <div class="flex flex-col items-center gap-2 py-14 text-slate-400">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <span class="text-sm">Chargement des abonnements…</span>
      </div>
    </template>
 
    <Column field="user_name" header="Client" sortable style="min-width: 12rem">
      <template #body="slotProps">
        <div class="flex items-center gap-2.5">
          <span class="avatar">{{ initials(slotProps.data.user_name) }}</span>
          <span class="font-medium text-slate-800">{{ slotProps.data.user_name }}</span>
        </div>
      </template>
    </Column>
 
    <Column field="start_date" header="Activation" sortable style="min-width: 9rem">
      <template #body="slotProps">
        <span class="text-slate-600 text-sm">{{ formatDate(slotProps.data.start_date) }}</span>
      </template>
    </Column>
 
    <Column field="end_date" header="Expiration" sortable style="min-width: 9rem">
      <template #body="slotProps">
        <span class="text-slate-600 text-sm">{{ formatDate(slotProps.data.end_date) }}</span>
      </template>
    </Column>
 
    <Column field="amount" header="Devise" sortable style="min-width: 7rem" bodyClass="text-right" headerClass="justify-end">
      <template #body="slotProps">
        <span class="font-semibold text-slate-800 tabular-nums">
          {{ formatPrice(slotProps.data.amount) }}
        </span>
        <span class="text-slate-400 text-xs ml-1">USD</span>
      </template>
    </Column>
 
    <Column field="custom_account_id" header="ID Compte" style="min-width: 8rem">
      <template #body="slotProps">
        <span class="text-slate-500 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
          {{ slotProps.data.custom_account_id }}
        </span>
      </template>
    </Column>
 
    <Column field="end_date" header="Statut" style="min-width: 8rem">
      <template #body="slotProps">
        <Tag
            :value="getStatus(slotProps.data.end_date)"
            :severity="getStatus(slotProps.data.end_date) === 'Expiré' ? 'danger' : 'success'"
            rounded
        />
      </template>
    </Column>
 
    <Column field="is_free_frial" header="Mode" style="min-width: 7rem">
      <template #body="slotProps">
        <Tag
            :value="checkSubMod(slotProps.data.is_free_frial)"
            :severity="slotProps.data.is_free_frial ? 'help' : 'info'"
            rounded
        />
      </template>
    </Column>
 
    <Column field="subscription_type" header="Type"  bodyClass="text-center" style="min-width: 8rem">
      <template #body="slotProps">
        <Tag
            :value="slotProps.data.subscription_type"
            :severity="{
              BASIC: 'success',
              MEDIUM: 'warning',
              PREMIUM: 'info',
              PLATINUM: 'warning',
              DIAMOND: 'contrast'
            }[slotProps.data.subscription_type]"
            class="!uppercase !tracking-wide"
            rounded
        />
      </template>
    </Column>
 
    <Column header="Action" bodyClass="text-center" style="min-width: 9rem">
      <template #body="slotProps">
        <div class="flex items-center justify-center gap-1.5">
          <Button
              label="Réactiver"
              icon="pi pi-refresh"
              size="small"
              severity="success"
              class="!text-xs"
              @click="handleReativate(slotProps.data)"
              v-if="getStatus(slotProps.data.end_date) === 'Expiré'"
          />
          <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              rounded
              aria-label="Supprimer"
              v-tooltip.top="'Supprimer'"
              @click="confirmDelete(slotProps.data)"
          />

        </div>
      </template>
    </Column>
  </DataTable>
 </div>




    <Dialog v-model:visible="deletelDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Confirmer la suppression" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Êtes-vous sûr de vouloir supprimer cet abonnement ?</span>
      </div>
      <template #footer>
        <Button label="Non" icon="pi pi-times" text @click="deletelDialog = false" />
        <Button label="Oui" icon="pi pi-check" text @click="deleteSubscription"/>
      </template>
    </Dialog>


  </div>
</template>



<style scoped>
/* ---------- Cartes de synthèse ---------- */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1rem;
  padding: 1rem 1.15rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}
.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* ---------- Avatar ---------- */
/* ---------- Avatar ---------- */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #4338ca;
  background: #eef2ff;
  flex-shrink: 0;
}


/* ---------- Badges ---------- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
}
.dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; }

.badge-green  { background: #ecfdf5; color: #047857; box-shadow: inset 0 0 0 1px #a7f3d0; }
.badge-red    { background: #fef2f2; color: #b91c1c; box-shadow: inset 0 0 0 1px #fecaca; }
.badge-pink   { background: #fdf2f8; color: #be185d; box-shadow: inset 0 0 0 1px #fbcfe8; }
.badge-cyan   { background: #ecfeff; color: #0e7490; box-shadow: inset 0 0 0 1px #a5f3fc; }
.badge-basic    { background: #f0fdf4; color: #15803d; box-shadow: inset 0 0 0 1px #bbf7d0; }
.badge-medium   { background: #fff7ed; color: #c2410c; box-shadow: inset 0 0 0 1px #fed7aa; }
.badge-premium  { background: #eff6ff; color: #1d4ed8; box-shadow: inset 0 0 0 1px #bfdbfe; }
.badge-platinum { background: #fefce8; color: #a16207; box-shadow: inset 0 0 0 1px #fef08a; }
.badge-diamond  { background: #f8fafc; color: #475569; box-shadow: inset 0 0 0 1px #cbd5e1; }



/* ---------- Table ---------- */
.subs-table :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1.25rem;
}
.subs-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}
.subs-table :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}
.subs-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}
.subs-table :deep(.p-paginator) {
  border-top: 1px solid #f1f5f9;
  padding: 0.85rem 1.25rem;
  background: #fff;
  font-size: 0.8rem;
}
.subs-table :deep(.p-sortable-column-icon) {
  width: 0.8rem;
  height: 0.8rem;
}

/* Scroll horizontal en dessous du seuil mobile, sans changer la structure */
@media (max-width: 768px) {
  .subs-table :deep(.p-datatable-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>