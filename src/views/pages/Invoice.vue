<script setup>
import {
  cancelInvoiceAPI,
  deleteInvoiceAPI,
  fetchInvoiceDetail,
  fetchInvoicesAllUsers,
  fetchUserProfilById,
  getUsersCreatedByMe,
  verifySecretKey
} from '@/service/Api';
import { clearCache, loadCache, saveCache } from '@/utils/cache';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// --- Toast & Loading ---
const toast = useToast();
const loading = ref(false);

// --- États ---
const invoicesCache = ref([]); // cache complet
const invoices = ref([]);      // factures affichées
const selectedInvoices = ref([]);
const invoiceDetails = ref([]);
const showModal = ref(false);
const deleteInvoicesDialog = ref(false);
const deleteMode = ref(null);


const userProfile = ref(null);
const userOptions = ref([]);
const selectedUserFilter = ref(null); // Dropdown utilisateur

const startDate = ref(null);
const endDate = ref(null);

const showSensitiveInfo = ref(false);
const secretDialog = ref(false);
const submittedSecret = ref(false);
const secretKey = ref('');
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const deleteMultipleDialog = ref(false);
const isSecretValidatedForView = ref(false);

const cancelDialog = ref(false); // cancel invoice 
const invoiceToCancel = ref(null); // 
// --- Helpers ---
const formatPrice = price => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
const formatDate = value => new Date(value).toLocaleString('fr-FR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });

// --- Charger profil + enfants ---
async function loadUserProfileAndChildren() {
  loading.value = true;
  try {
    const userId = parseInt(localStorage.getItem('id'));
    if (!userId) return;

    const profile = await fetchUserProfilById(userId);
    userProfile.value = Array.isArray(profile) ? profile[0] : profile;
    const children = await getUsersCreatedByMe();
    userOptions.value = [
      { id: userProfile.value.id, username: userProfile.value.username },
      ...children
    ];

    selectedUserFilter.value = userId;
    await loadInvoicesByUser(userId);

  } catch(err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de charger le profil ou les enfants', life:3000 });
  } finally {
    loading.value = false;
  }
}
const filteredInvoices = computed(() => {
  if (!invoicesCache.value.length) return [];

  const userID = selectedUserFilter.value ?? parseInt(localStorage.getItem('id'));

  return invoicesCache.value
    .filter(inv => String(inv.cashier) === String(userID))
    .filter(inv => {
      const created = new Date(inv.created_at); // ISO string from backend

      // UTC-safe date comparison (ignore time)
      if (startDate.value) {
        const start = new Date(Date.UTC(
          startDate.value.getFullYear(),
          startDate.value.getMonth(),
          startDate.value.getDate()
        ));
        const createdDate = Date.UTC(
          created.getUTCFullYear(),
          created.getUTCMonth(),
          created.getUTCDate()
        );
        if (createdDate < start.getTime()) return false;
        
      }

      if (endDate.value) {
        const end = new Date(Date.UTC(
          endDate.value.getFullYear(),
          endDate.value.getMonth(),
          endDate.value.getDate()
        ));
        const createdDate = Date.UTC(
          created.getUTCFullYear(),
          created.getUTCMonth(),
          created.getUTCDate()
        );
        if (createdDate > end.getTime()) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // tri décroissant
});


// --- Watchers pour reload automatique ---
watch([selectedUserFilter, startDate, endDate], () => {
  invoices.value = filteredInvoices.value;
});

// --- Reset filtres dates ---
function resetDateFilter() {
  startDate.value = null;
  endDate.value = null;
}

// --- Charger factures utilisateur ---
async function loadInvoicesByUser(userId, forceRefresh = false) {
  loading.value = true;
  try {
    let data = [];
    const cached = loadCache('Invoices');

    if (!forceRefresh && cached && cached.length) {
      invoicesCache.value = cached;
      console.log('Factures chargées depuis le cache');
    } else {
      data = await fetchInvoicesAllUsers(userId);
      saveCache('Invoices', data);
      invoicesCache.value = data;
      console.log('Factures chargées depuis l’API');
    }

    // Appliquer filtre utilisateur et date
    invoices.value = filteredInvoices.value;

  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les factures', life: 3000 });
  } finally {
    loading.value = false;
  }
}

// --- Voir détails facture ---
async function ViewDetailInvoice(invoiceId) {
  try {
    const details = await fetchInvoiceDetail(invoiceId);
    selectedInvoices.value = invoiceId;
    invoiceDetails.value = details;
    showModal.value = true;
    
  } catch(err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de charger les détails', life:3000 });
  }
}

// --- Supprimer facture ---
function confirmDeleteInvoice(inv){ 
  selectedInvoices.value = inv;
  secretDialog.value = true;
  deleteMode.value = "single";
}

function  confirmDeleteMultiple(){
  if(selectedInvoices.value.length === 0) return;
  secretDialog.value = true;
  deleteMode.value = "multiple";

}

function confirmCancelInvoice(invoice){
  invoiceToCancel.value = invoice;
  cancelDialog.value = true;
}

function askSecretForCancel(){
  cancelDialog.value = false;
  deleteMode.value ="ANNULER";
  secretDialog.value = true;
}


async function deleteInvoice() {
  try {
    await deleteInvoiceAPI(selectedInvoices.value.id);
    invoicesCache.value = invoicesCache.value.filter(i => i.id !== selectedInvoices.value.id);
    invoices.value = filteredInvoices.value;
    toast.add({ severity:'success', summary:'Supprimé', detail:'Facture supprimée', life:3000 });
    showModal.value = false;
    deleteInvoicesDialog.value = false;
    selectedInvoices.value =[];
  } catch(err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Erreur', detail:'Impossible de supprimer la facture', life:3000 });
  }
}

// --Supprimer les factures selectionner
async function deleteMultipleInvoices() {
  try{
    for(let inv of selectedInvoices.value){
      await deleteInvoiceAPI(inv.id);
    }

    invoicesCache.value = invoicesCache.value.filter( i =>
      !selectedInvoices.value.find(sel => sel.id === i.id)
    );

    invoices.value = filteredInvoices.value;
    selectedInvoices.value = [];

    toast.add({ 
      severity:'success', 
      summary:'Supprimées', 
      detail:'Factures supprimées avec succès', 
      life:3000 
    });
    deleteMultipleDialog.value = false;

  }catch(err){
    console.error('errur lors de la suppremision multipte :', err);

    toast.add({ 
      severity:'error', 
      summary:'Erreur', 
      detail:'Impossible de supprimer certaines factures', 
      life:3000 
    });

  } 
  
}
// function to cancel invoice

async function cancelInvoice(){
  try{
    await cancelInvoiceAPI(invoiceToCancel.value.id);

    invoiceToCancel.value.status ="ANNULER";

    invoicesCache.value = invoicesCache.value.map(inv => 
      inv.id === invoiceToCancel.value.id
      ? { ...inv, status:"ANNULER"}
      : inv
    );
    invoices.value = filteredInvoices.value;

    toast.add({
      severity: "success",
      summary: "Annulée",
      detail: "La facture a été annulée et le stock restauré",
      life: 3000
    });

    invoiceToCancel.value = null;
    secretDialog.value = false;
    secretKey.value = "";

  }catch(error){
      console.log("error to cancel invoice", error);
      toast.add({
      severity: "error",
      summary: "Erreur",
      detail: "Impossible d'annuler la facture",
      life: 3000
    });

  }
}

// --- Vérification code secret ---
async function verifySecret() {
  submittedSecret.value = true;
  if (!secretKey.value) return;
  try {
    const isValid = await verifySecretKey(secretKey.value);
    if (isValid.valid) {
      showSensitiveInfo.value = true;
      secretDialog.value = false;
      toast.add({ severity:'success', summary:'Succès', detail:'Code secret validé', life:3000 });
      secretDialog.value = false;
       secretKey.value ="";

      if(deleteMode.value ==="single"){
        deleteInvoice();
      } else if(deleteMode.value ==="multiple"){
        deleteMultipleInvoices();
      } else if (deleteMode.value ==="ANNULER"){
        cancelInvoice();
      }

      if(deleteMode.value === "viewSensitive") {
        isSecretValidatedForView.value = true;
      }
   

     
    } else {
      toast.add({ severity:'error', summary:'Erreur', detail:'Code secret invalide', life:3000 });
    }
  } catch(err) {
    toast.add({ severity:'error', summary:'Erreur', detail:'Erreur de vérification', life:3000 });
  }
}

// --- Actualiser factures ---
async function refreshInvoices() {
  loading.value = true;
  try {
    clearCache('Invoices');
    await loadUserProfileAndChildren();
    toast.add({ severity: 'success', summary: 'Actualisé', detail: 'Les factures ont été rechargées', life: 3000 });
  } catch(err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de recharger les factures', life: 3000 });
  } finally {
    loading.value = false;
  }
}

// --- Mounted ---
onMounted(async () => {
  await loadUserProfileAndChildren();
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
            label="Afficher Bénéfice" 
            icon="pi pi-lock" 
            severity="warning" 
            @click="secretDialog = true; deleteMode= 'viewSensitive'" 
          />

          </div>
        </template>

        <!-- Right: filtre utilisateur + refresh -->
        <template #end>
          <div class="flex flex-wrap items-center gap-2">
            <label for="userFilter" class="font-medium">Utilisateur :</label>

            <Select
              v-model="selectedUserFilter"
              :options="userOptions.map(u =>({id: u.id, username: u.username}))"
              optionLabel="username"
              optionValue="id"
              placeholder="Sélectionner utilisateur"
               class="w-full sm:w-56"
              showClear
            />

          <div class="flex gap-4 mb-4">
            <div class="flex flex-col">
              <label>Date début :</label>
              <Calendar
                v-model="startDate"
                dateFormat="yy-mm-dd"    
                placeholder="Date début"
                showIcon
                :monthNavigator="true"
                :yearNavigator="true"
                :showButtonBar="true"
              />
            </div>
            <div class="flex flex-col">
              <label>Date fin :</label>
                  <Calendar
                v-model="endDate"
                dateFormat="yy-mm-dd"     
                placeholder="Date fin"
                showIcon
                :showTime="false"         
                :monthNavigator="true"
                :yearNavigator="true"
                :showButtonBar="true"
              />
            </div>
            <button
              class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 self-end"
              @click="resetDateFilter"
            >
              Réinitialiser
            </button>
          </div>



            <Button label="Actualiser" icon="pi pi-refresh" severity="primary" @click="refreshInvoices" />
          </div>
        </template>
      </Toolbar>
    </div>

    <!-- DataTable Factures -->
    <div class="card overflow-x-auto">


     <DataTable
  ref="dt"
  :value="filteredInvoices"
  v-model:selection="selectedInvoices"
  dataKey="id"
  :paginator="true"
  :rows="10"
  :filters="filters"
  selectionMode="multiple"
  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
  :rowsPerPageOptions="[5, 10, 25]"
  currentPageReportTemplate="Affichage {first} à {last} de {totalRecords} factures"
  class="min-w-full compact-table"
>

  <!-- HEADER -->
  <template #header>
    <div v-if="loading" class="text-center py-8 text-gray-500">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
    </div>

    <div v-else class="flex flex-col gap-3">

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Factures</h4>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <InputText 
            v-model="filters['global'].value" 
            type="text" 
            placeholder="Rechercher..." 
            class="flex-1"
          />
          <i class="pi pi-search text-gray-400"></i>
        </div>
      </div>

      <div>
        <Button 
          label="Supprimer les factures sélectionnées"
          icon="pi pi-trash"
          severity="danger"
          class="w-full sm:w-auto"
          :disabled="selectedInvoices.length === 0"
          @click="deleteMultipleDialog = true"
        />
      </div>

    </div>
  </template>

  <!-- Colonnes -->
  <Column selectionMode="multiple" headerStyle="width: 40px"></Column>

  <Column field="id" header="ID" sortable style="max-width: 60px;">
    <template #body="slotProps">
      <span class="cell">{{ slotProps.data.id }}</span>
    </template>
  </Column>

  <Column field="client_name" header="Client" sortable style="max-width: 130px;">
    <template #body="slotProps">
      <span class="cell">{{ slotProps.data.client_name }}</span>
    </template>
  </Column>

  <Column field="cashier_name" header="Caissier" sortable style="max-width: 120px;">
    <template #body="slotProps">
      <span class="cell">{{ slotProps.data.cashier_name }}</span>
    </template>
  </Column>

  <Column field="total_amount" header="Total" sortable style="max-width: 110px;">
    <template #body="slotProps">
      <span class="cell">{{ formatPrice(slotProps.data.total_amount) }}</span>
    </template>
  </Column>

  <Column v-if="isSecretValidatedForView" field="profit_amount" header="Bénéfice" sortable style="max-width: 110px;">
    <template #body="slotProps">
      <span class="cell">{{ formatPrice(slotProps.data.profit_amount) }}</span>
    </template>
  </Column>

  <Column field="change" header="Reste" sortable style="max-width: 110px;">
    <template #body="slotProps">
      <span class="cell">{{ formatPrice(slotProps.data.change) }}</span>
    </template>
  </Column>

  <Column field="amount_paid" header="Payé" sortable style="max-width: 110px;">
    <template #body="slotProps">
      <span class="cell">{{ formatPrice(slotProps.data.amount_paid) }}</span>
    </template>
  </Column>

  <Column field="tva" header="TVA" sortable style="max-width: 90px;">
    <template #body="slotProps">
      <span class="cell">{{ formatPrice(slotProps.data.tva) || 'N/A' }}</span>
    </template>
  </Column>

  <Column field="cashier_currency" header="Devise" sortable style="max-width: 70px;">
    <template #body="slotProps">
      <span class="cell">{{ slotProps.data.cashier_currency }}</span>
    </template>
  </Column>

  <Column field="created_at" header="Date" sortable style="max-width: 150px;">
    <template #body="slotProps">
      <span class="cell">{{ formatDate(slotProps.data.created_at) }}</span>
    </template>
  </Column>

  <Column header="Statut" field="status" sortable style="max-width: 95px;">
    <template #body="slotProps">
      <span 
        class="px-2 py-1 rounded text-white text-xs whitespace-nowrap"
        :class="slotProps.data.status === 'ANNULER' ? 'bg-red-500' : 'bg-green-500'"
      >
        {{ slotProps.data.status }}
      </span>
    </template>
  </Column>

  <Column header="Actions" style="max-width: 160px;">
    <template #body="slotProps">
      <div class="flex gap-1">
        <Button icon="pi pi-trash" outlined rounded severity="danger" class="action-btn" @click="confirmDeleteInvoice(slotProps.data)" />
        <Button icon="pi pi-eye" outlined rounded class="action-btn" @click="ViewDetailInvoice(slotProps.data.id)" />
        <Button icon="pi pi-ban" outlined rounded severity="danger" class="action-btn" @click="confirmCancelInvoice(slotProps.data)" />
      </div>
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
        <Button label="Oui" icon="pi pi-check" text @click="deleteInvoice"/>
      </template>
    </Dialog>

      <Dialog 
        v-model:visible="secretDialog" 
        header="Entrer le code secret" 
        :modal="true" 
        :closable="false" 
        :style="{ width: '90%', maxWidth: '350px' }"
      >
        <div class="flex flex-col gap-2">
          <label for="secret" class="font-medium">Code secret</label>
          <InputText 
            id="secret" 
            v-model.trim="secretKey" 
            :class="{ 'p-invalid': submittedSecret && !secretKey }" 
            autofocus
            @keyup.enter="verifySecret"
          />
          <small v-if="submittedSecret && !secretKey" class="p-error">
            Le code secret est requis.
          </small>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="Annuler" 
              icon="pi pi-times" 
              text 
              @click="secretDialog = false" 
            />
            <Button 
              label="Valider" 
              icon="pi pi-check" 
              severity="success" 
              @click="verifySecret" 
            />
          </div>
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
            <p class="mt-2 text-sm"><strong>Client(e) :</strong> {{ invoices.find(c => c.id === selectedInvoices)?.client_name || 'N/D' }}</p>
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
         <div class="flex justify-end mt-4 border-t pt-4">
          <p class="text-lg sm:text-xl font-bold text-right">
            TVA : <span class="text-green-600">
              {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || 'N/A' }}
              {{ invoices.find(c => c.id === selectedInvoices)?.tva || 'N/A' }}
            </span>
          </p>
        </div>

      </div>
    </Dialog>

      <Dialog 
      v-model:visible="deleteMultipleDialog" 
      header="Confirmer la suppression" 
      :modal="true"
       >
      <p>Voulez-vous vraiment supprimer 
        <strong>{{ selectedInvoices.length }}</strong> facture(s) ?</p>

      <div class="flex justify-end gap-2 mt-4">
          <Button label="Annuler" @click="deleteMultipleDialog = false" />
          <Button 
              label="Supprimer" 
              severity="danger" 
              @click="confirmDeleteMultiple" 
          />
      </div>
  </Dialog>

  <Dialog v-model:visible="cancelDialog" header="Annuler la facture" :modal="true">
    <p class="mb-4">Voulez-vous vraiment annuler cette facture ?</p>

    <div class="flex justify-end gap-2">
      <Button label="Non" icon="pi pi-times" @click="cancelDialog = false" text />
      <Button label="Oui" icon="pi pi-check" severity="warning" @click="askSecretForCancel" />
    </div>
  </Dialog>


  </div>
</template>
