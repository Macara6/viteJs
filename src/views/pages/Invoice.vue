

<script setup>
import {
  deleteInvoiceAPI,
  fetchInvoiceDetail,
  fetchInvoicesAllChildrent,
  fetchInvoicesAllUsers,
  fetchUserProfilById,
  fetchUsers
} from '@/service/Api';
import { FilterMatchMode } from '@primevue/core';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

// Références
const dt = ref();
const deleteInvoiceDialog = ref(false);
const deleteInvoicesDialog = ref(false);
const showModal = ref(false);

// États
const invoices = ref([]);
const invoice = ref({});
const selectedInvoices = ref([]);
const invoiceDetails = ref([]);
const users = ref({});
const userProfile = ref(null);

// Filtres et options
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const showOnlyChildren = ref(false);

// --- Cache utils ---
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (name) => `cache_${name}`;

const saveCache = (name, data) => {
    localStorage.setItem(cacheKey(name), JSON.stringify({ data, timestamp: Date.now() }));
};

const loadCache = (name) => {
    const cached = localStorage.getItem(cacheKey(name));
    if (!cached) return null;
    try {
        const payload = JSON.parse(cached);
        if (Date.now() - payload.timestamp < CACHE_EXPIRATION_MS) return payload.data;
        localStorage.removeItem(cacheKey(name));
        return null;
    } catch {
        return null;
    }
};

// --- Lifecycle ---
onMounted(async () => {
    const userId = localStorage.getItem('id');
    if(!userId) {
        toast.add({ severity: 'warn', summary: 'Utilisateur non identifié', detail: 'Veuillez vous reconnecter.', life: 3000 });
        return;
    }
    await loadUserProfile(userId);
    await loadInvoicesAndUsers();
});

// --- Chargement profil utilisateur avec cache ---
async function loadUserProfile(userId) {
    const cached = loadCache('userProfile');
    if(cached) {
        userProfile.value = cached;
        return;
    }
    try {
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        saveCache('userProfile', userProfile.value);
    } catch(error) {
        console.error('Erreur récupération profil utilisateur', error);
    }
}

// --- Chargement factures et utilisateurs avec cache ---
async function loadInvoicesAndUsers() {
    try {
        const cachedUsers = loadCache('users');
        const cachedInvoices = loadCache(showOnlyChildren.value ? 'invoicesChildren' : 'invoicesAll');

        if(cachedUsers && cachedInvoices) {
            users.value = cachedUsers;
            invoices.value = cachedInvoices;
            return;
        }

        const [fetchedUsers, invoicesData] = await Promise.all([
            cachedUsers ? Promise.resolve(cachedUsers) : fetchUsers(),
            cachedInvoices ? Promise.resolve(cachedInvoices) : (showOnlyChildren.value ? fetchInvoicesAllChildrent(true) : fetchInvoicesAllUsers())
        ]);

        // Transform users en dictionnaire { id: username }
        const usersDict = fetchedUsers.reduce((acc, user) => {
            acc[user.id] = user.username;
            return acc;
        }, {});

        users.value = usersDict;
        invoices.value = invoicesData.map(invoice => ({
            ...invoice,
            cashier_name: usersDict[invoice.cashier] || 'Unknown'
        }));

        // Tri par date
        invoices.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Sauvegarde cache
        saveCache('users', usersDict);
        saveCache(showOnlyChildren.value ? 'invoicesChildren' : 'invoicesAll', invoices.value);
    } catch(error) {
        console.error('Erreur chargement factures et utilisateurs', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoices', life: 3000 });
    }
}

// --- Forcer actualisation (supprime cache et recharge) ---
async function forceRefresh() {
    localStorage.removeItem('cache_users');
    localStorage.removeItem('cache_invoicesAll');
    localStorage.removeItem('cache_invoicesChildren');
    invoices.value = [];
    users.value = {};
    await loadInvoicesAndUsers();
    toast.add({ severity: 'success', summary: 'Actualisé', detail: 'Données rechargées depuis le serveur', life: 3000 });
}

// --- Détail facture ---
async function ViewDetailInvoice(invoiceId) {
    try {
        const details = await fetchInvoiceDetail(invoiceId);
        selectedInvoices.value = invoiceId;
        invoiceDetails.value = details;
        showModal.value = true;
    } catch(error) {
        console.error('Erreur récupération détails facture', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch invoice details', life: 3000 });
    }
}

// --- Supprimer facture ---
async function deleteInvoice() {
    try {
        await deleteInvoiceAPI(invoice.value.id);
        invoices.value = invoices.value.filter(val => val.id !== invoice.value.id);
        saveCache(showOnlyChildren.value ? 'invoicesChildren' : 'invoicesAll', invoices.value);

        deleteInvoiceDialog.value = false;
        selectedInvoices.value = null;
        toast.add({ severity: 'success', summary:'Successful', detail:'Invoice deleted', life:3000});
    } catch(error) {
        console.error('Erreur suppression facture', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete invoice', life: 3000 });
    }
}

function confirmDeleteInvoice(inv) {
    invoice.value = inv;
    deleteInvoiceDialog.value = true;
}

function confirmDeleteSelected() {
    deleteInvoicesDialog.value = true;
}

function deleteSelectedInvoices() {
    const selectedIds = selectedInvoices.value.map(i => i.id);
    invoices.value = invoices.value.filter(val => !selectedIds.includes(val.id));
    saveCache(showOnlyChildren.value ? 'invoicesChildren' : 'invoicesAll', invoices.value);

    deleteInvoicesDialog.value = false;
    selectedInvoices.value = null;
}

// --- Refresh depuis cache ---
function refreshPage() {
    forceRefresh(); // supprime cache et recharge
}

// --- Utils ---
function formatDate(value) {
    const options = { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12: false };
    return new Date(value).toLocaleString('sv-SE', options).replace(' ',' ');
}

function remiseTaux(totalPayer, value){
   return parseFloat(((value*100)/totalPayer).toFixed(2));
}

function formatPrice(price){
    return price != null ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ") : price;
}
</script>





<template>
  <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
    
    <!-- Toolbar -->
    <div class="card mb-6">
      <Toolbar class="flex flex-wrap justify-between items-center gap-2">
        <template #start>
          <Button label="Effacer" icon="pi pi-trash" severity="danger" 
            :disabled="!selectedInvoices || !selectedInvoices.length"
            @click="confirmDeleteSelected" />
        </template>
        <template #end>
          <div class="flex flex-wrap items-center gap-2">
            <Checkbox v-model="showOnlyChildren" :binary="true" inputId="onlyChildren" @change="refreshPage" />
            <label for="onlyChildren" class="ml-2 whitespace-nowrap">Enfants uniquement</label>
            <Button label="Actualiser" icon="pi pi-refresh" severity="primary" @click="refreshPage" />
          </div>
        </template>
      </Toolbar>
    </div>

    <!-- DataTable -->
    <div class="card overflow-x-auto">
      <DataTable
        ref="dt"
        :value="invoices"
        v-model:selection="selectedInvoices"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Factures"
        class="min-w-full"
      >
        <template #header>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Factures</h4>
            <div class="flex flex-1 sm:flex-none items-center gap-2 mt-2 sm:mt-0">
              <InputText v-model="filters['global'].value" type="date" class="flex-1 sm:w-auto" placeholder="Rechercher..." />
              <i class="pi pi-search text-gray-400"></i>
            </div>
          </div>
        </template>

        <!-- Colonnes -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />
        <Column field="id" header="ID" sortable style="min-width: 3rem" />
        <Column field="client_name" header="Nom Client(e)" sortable style="min-width: 8rem" />
        <Column field="cashier_name" header="Caissier(e)" sortable style="min-width: 8rem" />
        <Column field="total_amount" header="Total" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.total_amount) }}</template>
        </Column>
        <Column field="profit_amount" header="Bénéfice" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.profit_amount) }}</template>
        </Column>
        <Column field="change" header="Reste" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.change) }}</template>
        </Column>
        <Column field="amount_paid" header="Montant Perçu" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.amount_paid) }}</template>
        </Column>
        <Column field="cashier_currency" header="Devise" sortable style="min-width: 4rem">
          <template #body="slotProps">{{ slotProps.data.cashier_currency }}</template>
        </Column>
        <Column field="created_at" header="Date" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatDate(slotProps.data.created_at) }}</template>
        </Column>
        <Column field="inventoryStatus" header="Action" sortable style="min-width: 12rem">
          <template #body="slotProps">
            <Button icon="pi pi-eye" outlined rounded class="mr-2 mb-1 sm:mb-0" @click="ViewDetailInvoice(slotProps.data.id)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteInvoice(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete Invoice Dialog -->
    <Dialog v-model:visible="deleteInvoicesDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Confirm" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Are you sure you want to delete the selected invoice?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteInvoicesDialog = false" />
        <Button label="Yes" icon="pi pi-check" text @click="deleteInvoice" />
      </template>
    </Dialog>

    <!-- Invoice Details Modal -->
    <Dialog v-model:visible="showModal" modal header="🧾 Détails de la facture" :style="{ width: '95%', maxWidth: '900px' }">
      <div class="p-4 sm:p-6 bg-gray-50 rounded-md shadow-sm overflow-y-auto max-h-[70vh]">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between border-b pb-4 mb-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
              {{ userProfile ? userProfile.entrep_name : 'Entreprise non définie' }}
            </h2>
            <p class="text-gray-600 text-sm sm:text-base">
              {{ userProfile ? userProfile.adress : 'Adresse non définie' }}
            </p>
            <p class="mt-2 text-sm"><strong>Client :</strong> {{ invoices.find(c => c.id === selectedInvoices)?.client_name || 'N/D' }}</p>
            <p class="text-sm"><strong>Caissier :</strong> {{ invoices.find(c => c.id === selectedInvoices)?.cashier_name || 'N/D' }}</p>
          </div>
          <div class="text-right text-sm sm:text-base text-gray-500 mt-2 sm:mt-0">
            <p><strong>Date :</strong> {{ formatDate(invoices.find(c => c.id === selectedInvoices)?.created_at) || 'N/A' }}</p>
            <p><strong>Facture ID :</strong> {{ selectedInvoices }}</p>
          </div>
        </div>

        <!-- Invoice Products -->
        <div v-if="invoiceDetails.length > 0" class="overflow-x-auto">
          <DataTable :value="invoiceDetails" class="p-datatable-sm shadow-sm rounded-md">
            <Column field="product_name" header="Produit" style="min-width: 150px">
              <template #body="slotProps">
                <span class="font-medium">{{ slotProps.data.product_name }}</span>
              </template>
            </Column>
            <Column field="price" header="Prix U" style="min-width: 80px">
              <template #body="slotProps">
                {{ userProfile ? userProfile.currency_preference : '' }}{{ formatPrice(slotProps.data.price) }}
              </template>
            </Column>
            <Column field="quantity" header="Qté" style="width: 60px; text-align: center;">
              <template #body="slotProps">{{ slotProps.data.quantity }}</template>
            </Column>
            <Column header="Total" style="min-width: 80px">
              <template #body="slotProps">
                {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || 'N/A' }}
                {{ formatPrice(slotProps.data.price * slotProps.data.quantity) }}
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Total -->
        <div class="flex justify-end mt-4 border-t pt-4">
          <p class="text-lg sm:text-xl font-bold text-right">
            Total : <span class="text-green-600">
              {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || 'N/A' }}
              {{ invoices.find(c => c.id === selectedInvoices)?.total_amount || 'N/A' }}
            </span>
          </p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 640px) {
  .p-button {
    width: 100%;
  }
  .p-datatable th,
  .p-datatable td {
    font-size: 0.85rem;
    padding: 0.3rem 0.5rem;
  }
}
</style>
