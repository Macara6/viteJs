
<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

import {
  deleteInvoiceAPI,
  fetchInvoiceDetail,
  fetchInvoicesAllUsers,
  fetchUserProfilById,
  getUsersCreatedByMe,
  verifySecretKey
} from '@/service/Api';

const toast = useToast();
const loading = ref(false);
// États
const invoices = ref([]);
const selectedInvoices = ref([]);
const invoiceDetails = ref([]);
const showModal = ref(false);
const deleteInvoicesDialog = ref(false);

const userProfile = ref(null);
const userOptions = ref([]);
const selectedUserFilter = ref(null); // ici le Dropdown

const showSensitiveInfo = ref(false);
const secretDialog = ref(false);
const submittedSecret = ref(false);
const secretKey = ref('')

const filters = ref({ global: { value: null, matchMode: 'contains' } });

let invoicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// --- Helpers ---
const formatPrice = price => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
const formatDate = value => new Date(value).toLocaleString('fr-FR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });

// --- Charger profil utilisateur + enfants ---
async function loadUserProfileAndChildren() {
  loading.value = true;
  try {
    const userId = parseInt( localStorage.getItem('id'))
    if (!userId) return;

    // Profil utilisateur
    const profile = await fetchUserProfilById(userId);
    userProfile.value = Array.isArray(profile) ? profile[0] : profile;

    // Enfants de l'utilisateur
    const children = await getUsersCreatedByMe();
    userOptions.value = [
      { id: userProfile.value.id, username: userProfile.value.username }, // utilisateur connecté en premier
      ...children
    ];

    // **Sélection par défaut : utilisateur connecté**
    selectedUserFilter.value = userId;
    // Charger factures pour l'utilisateur connecté
    await loadInvoicesByUser(selectedUserFilter.value);
     

  } catch (err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de charger le profil ou les enfants', life:3000 });
  }finally{
    loading.value = false
  }
}

// --- Charger factures pour un utilisateur donné ---
async function loadInvoicesByUser(userId, forceRefresh = false) {
  loading.value = true;
  try {
    const now = Date.now();
    // on charge le cacehe si il 'existe
    if(!forceRefresh && invoicesCache && (now - cacheTimestamp < CACHE_DURATION)){
      invoices.value = invoicesCache
        .filter(i => i.cashier === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return;
    }

    const invoicesData = await fetchInvoicesAllUsers(userId);
    invoicesCache = invoicesData;
    cacheTimestamp = now;

    invoices.value = invoicesData
      .filter(i => i.cashier === userId)  // uniquement factures de l'utilisateur sélectionné
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
  } catch (err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de charger les factures', life:3000 });
  }finally{
    loading.value = false;
  }
}

// --- Watcher : si l'utilisateur change dans le Dropdown ---
watch(selectedUserFilter, async (newId) => {
  if (newId) await loadInvoicesByUser(newId);
});

// --- Détails facture ---
async function ViewDetailInvoice(invoiceId) {
  try {
    const details = await fetchInvoiceDetail(invoiceId);
    selectedInvoices.value = invoiceId;
    invoiceDetails.value = details;
    showModal.value = true;
  } catch (err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de charger les détails', life:3000 });
  }
}

// --- Supprimer facture ---
function confirmDeleteInvoice(inv){ 
  selectedInvoices.value = inv;
   deleteInvoicesDialog.value =true 
  }

async function deleteInvoice(){
  try {
    await deleteInvoiceAPI(selectedInvoices.value.id);
    invoices.value = invoices.value.filter(i => i.id !== selectedInvoices.value.id);
    toast.add({ severity:'success', summary:'Supprimé', detail:'Facture supprimée', life:3000 });
    showModal.value = false;
    deleteInvoicesDialog.value =false;
  } catch(err){
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de supprimer la facture', life:3000 });
  }
}

async function refreshInvoices() {
  loading.value = true;
  try {
    const userId = parseInt(localStorage.getItem('id'));
    selectedUserFilter.value = userId;

    if (!userId) return;

    // Forcer récupération serveur (ignore le cache)
    await loadInvoicesByUser(userId, true);

    toast.add({ 
      severity: 'success', 
      summary: 'Actualisé', 
      detail: 'Les factures ont été rechargées', 
      life: 3000 
    });
  } catch (err) {
    console.error(err);
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de recharger les factures', 
      life: 3000 
    });
  }finally{
    loading.value = false;
  }
}


async function verifySecret() {
  submittedSecret.value = true
  if (!secretKey.value) return
  try {
    const isValid = await verifySecretKey(secretKey.value)
    if (isValid.valid) {
      showSensitiveInfo.value = true
      secretDialog.value = false
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Code secret validé', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Code secret invalide', life: 3000 })
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de vérification', life: 3000 })
  }
}
// --- Mounted ---
onMounted(async () => {
  await loadUserProfileAndChildren(); // charge profil, enfants et factures
});
</script>




<template>
  <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-gray-900">

    <!-- Toolbar -->
    <div class="card mb-6">
      <Toolbar class="flex flex-wrap justify-between items-center gap-2">

        <!-- Left: supprimer sélection -->
        <template #start>
          <div class="flex flex-wrap gap-2 justify-end">
          <Button 
            label="Effacer" icon="pi pi-trash" severity="danger"
            :disabled="!selectedInvoices || !selectedInvoices.length"
            @click="confirmDeleteSelected" 
          />
          <Button label="Bénéfice" icon="pi pi-lock" severity="warning" @click="secretDialog = true" />
          </div>
        </template>

        <!-- Right: filtre utilisateur + refresh -->
        <template #end>
          <div class="flex flex-wrap items-center gap-2">
            <label for="userFilter" class="font-medium">Utilisateur :</label>
            <Dropdown
              v-model="selectedUserFilter"
              :options="userOptions"
              optionLabel="username"
              optionValue="id"
              placeholder="Sélectionner utilisateur"
              @change="refreshPage"
              showClear
            />
            <Button label="Actualiser" icon="pi pi-refresh" severity="primary" @click="refreshInvoices" />
          </div>
        </template>

      </Toolbar>
    </div>

    <!-- DataTable Factures -->
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
        currentPageReportTemplate="Affichage {first} à {last} de {totalRecords} factures"
        class="min-w-full"
        :loading="loading"

      >
        <template #header>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Factures</h4>
            <div class="flex flex-1 sm:flex-none items-center gap-2 mt-2 sm:mt-0">
              <InputText v-model="filters['global'].value" type="text" placeholder="Rechercher..." class="flex-1 sm:w-auto" />
              <i class="pi pi-search text-gray-400"></i>
            </div>
          </div>
        </template>

        <!-- Colonnes -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />
        <Column field="id" header="ID" sortable />
        <Column field="client_name" header="Nom Client(e)" sortable />
        <Column field="cashier_name" header="Caissier(e)" sortable />
        <Column field="total_amount" header="Total" sortable>
          <template #body="slotProps">{{ formatPrice(slotProps.data.total_amount) }}</template>
        </Column>
        <Column v-if="showSensitiveInfo" field="profit_amount" header="Bénéfice" sortable>
          <template #body="slotProps">{{ formatPrice(slotProps.data.profit_amount) }}</template>
        </Column>
        <Column field="change" header="Reste" sortable>
          <template #body="slotProps">{{ formatPrice(slotProps.data.change) }}</template>
        </Column>
        <Column field="amount_paid" header="Montant Perçu" sortable>
          <template #body="slotProps">{{ formatPrice(slotProps.data.amount_paid) }}</template>
        </Column>
        <Column field="cashier_currency" header="Devise" sortable />
        <Column field="created_at" header="Date" sortable>
          <template #body="slotProps">{{ formatDate(slotProps.data.created_at) }}</template>
        </Column>
        <Column header="Actions" style="min-width: 12rem">
          <template #body="slotProps">
            <Button icon="pi pi-eye" outlined rounded class="mr-2 mb-1 sm:mb-0" @click="ViewDetailInvoice(slotProps.data.id)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteInvoice(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete Invoice Dialog -->
    <Dialog v-model:visible="deleteInvoicesDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Confirmer la suppression" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Êtes-vous sûr de vouloir supprimer la ou les factures sélectionnées ?</span>
      </div>
      <template #footer>
        <Button label="Non" icon="pi pi-times" text @click="deleteInvoicesDialog = false" />
        <Button label="Oui" icon="pi pi-check" text @click="deleteInvoice" />
      </template>
    </Dialog>

     <Dialog v-model:visible="secretDialog" header="Entrer code secret" :modal="true" :closable="false" :style="{ width: '90%', maxWidth: '350px' }">
      <div>
        <label for="secret">Code secret</label>
        <InputText id="secret" v-model.trim="secretKey" :class="{ 'p-invalid': submittedSecret && !secretKey }" autofocus />
        <small v-if="submittedSecret && !secretKey" class="p-error">Le code secret est requis.</small>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="secretDialog = false" />
        <Button label="Valider" icon="pi pi-check" @click="verifySecret" />
      </template>
    </Dialog>
    <!-- Invoice Details Modal -->
    <Dialog v-model:visible="showModal" modal header="🧾 Détails de la facture" :style="{ width: '95%', maxWidth: '900px' }">
      <div class="p-4 sm:p-6 bg-gray-50 rounded-md shadow-sm overflow-y-auto max-h-[70vh]">

        <!-- Header facture -->
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

        <!-- Produits facture -->
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

        <!-- Total facture -->
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
