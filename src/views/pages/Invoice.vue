<script setup>
import {
  cancelInvoiceAPI,
  checkSecretKeyStatus,
  deleteInvoiceAPI,
  fetchInvoiceDetail,
  fetchInvoicesAllUsers,
  fetchUserProfilById,
  getUsersCreatedByMe,
  verifySecretKey
} from '@/service/Api';
import { clearCache, loadCache, saveCache } from '@/utils/cache';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
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
const hasSecretKey = ref(false);


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

    //  Vérifie si on a déjà le profil + enfants dans le cache
    const hasCachedProfile = userProfile.value && userProfile.value.id === userId;
    const hasCachedChildren = userOptions.value && userOptions.value.length > 1;

    let profilePromise = null;
    let childrenPromise = null;

    //  Ne charge depuis API que si pas en cache
    if (!hasCachedProfile) {
      profilePromise = fetchUserProfilById(userId);
    }

    if (!hasCachedChildren) {
      childrenPromise = getUsersCreatedByMe();
    }

    //  Attendre seulement ce qui est nécessaire
    const [profileData, childrenData] = await Promise.all([
      profilePromise,
      childrenPromise
    ]);

    //  Mettre le profil en cache si rechargé
    if (profileData) {
      userProfile.value = Array.isArray(profileData)
        ? profileData[0]
        : profileData;
    }

    //  Mettre les enfants en cache si rechargés
    if (childrenData) {
      userOptions.value = [
        { id: userProfile.value.id, username: userProfile.value.username },
        ...childrenData
      ];
    }

    //  Définir l’utilisateur sélectionné
    selectedUserFilter.value = userId;

    //  Charger les factures uniquement si pas en cache
    if (!invoices.value || invoices.value.length === 0) {
      await loadInvoicesByUser(userId);
    }

  } catch (err) {
    console.error(err);
    toast.add({
      severity:'error',
      summary:'Erreur',
      detail:'Impossible de charger le profil ou les enfants',
      life:3000
    });
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
      loading.value = false;
      return;
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
  if(hasSecretKey.value == true){
    secretDialog.value = true;
    deleteMode.value = "single";
  }else{
    deleteInvoicesDialog.value = true;
  
  }

}

function  confirmDeleteMultiple(){
  if(selectedInvoices.value.length === 0) return;
  if(hasSecretKey.value == true){
     secretDialog.value = true;
    deleteMode.value = "multiple";
  }else{
    deleteMultipleDialog.value = true;
    deleteMultipleInvoices(); 
  }

}

function confirmCancelInvoice(invoice){
  invoiceToCancel.value = invoice;
  cancelDialog.value = true;
}

function askSecretForCancel(){
  cancelDialog.value = false;
  if(hasSecretKey.value == true){
     deleteMode.value ="ANNULER";
     secretDialog.value = true;
  }else{
    cancelDialog.value = true
    cancelInvoice();
  }

}
function openView(){
  if(hasSecretKey.value == true){
    deleteMode.value ="viewSensitive";
    secretDialog.value = true
  }else{
    isSecretValidatedForView.value = true;
  }
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
   const result = await cancelInvoiceAPI(invoiceToCancel.value.id);

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
      detail: result.message,
      life: 3000
    });

    invoiceToCancel.value = null;
    secretDialog.value = false;
    cancelDialog.value = false;
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
async function checkSecretKey(){
  try{
    const res = await checkSecretKeyStatus();
    hasSecretKey.value = res.has_key || false;
    if(hasSecretKey.value == true){
      console.log('cet utilisateur a un code secret');
    }else{
      console.log('cette utilisateur  n as pas de code secret')
    }
  }catch(error){
    console.error("Erreur lors de la vetification du code secret");
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

function downloadPDFInvoices() {

  // Création du PDF en A4 vertical
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const columns = [
    {header:'Client', dataKey:'client_name'},
    {header:'Caissier(e)', dataKey:'cashier_name'},
    {header:'Total', dataKey:'total_amount'},
    {header:'Bénéfice', dataKey:'profit_amount'},
    {header:'Reste', dataKey:'change'},
    {header:'Montant dû', dataKey:'amount_paid'},
    {header:'TVA', dataKey:'tva'},
    {header:'Devise', dataKey:'cashier_currency'},
    {header:'Date', dataKey:'created_at'},
    {header:'Status', dataKey:'status'},
  ];

  const rows = filteredInvoices.value.map(item => ({
    ...item,
    created_at: formatDate(item.created_at),
    total_amount: formatPrice(item.total_amount),
    profit_amount: formatPrice(item.profit_amount),
    change: formatPrice(item.change),
    amount_paid: formatPrice(item.amount_paid),
    tva: formatPrice(item.tva),
    cashier_name:item.cashier_name
  }));

  const cashiers = [...new Set(rows.map(r => r.cashier_name))];

  let pdfUserName = "Multiple utilisateurs";

  if (cashiers.length === 1) {
    pdfUserName = cashiers[0]; // Un seul caissier dans les données
  }

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => row[c.dataKey])),
    startY: 25,
    theme: 'striped',
    styles: {
      fontSize: 8,          // pour que tout rentre dans l’A4
      cellPadding: 2
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
    },
    columnStyles: {
      total_amount: { cellWidth: 20 },
      profit_amount: { cellWidth: 20 },
      amount_paid: { cellWidth: 20 },
      tva: { cellWidth: 18 },
      change: { cellWidth: 18 },
    }
  });

  doc.text('Liste des factures', 14, 15);
  doc.setFontSize(10);
  doc.text(`Utilisateur : ${pdfUserName}`, 14, 22);
  doc.save('liste_factures.pdf');
}


// --- Mounted ---
onMounted(async () => {
  await loadUserProfileAndChildren();
  await checkSecretKey();
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
            @click="openView" 
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

  <div v-else class="flex flex-col gap-4">

    <!-- Ligne du haut : Titre + boutons -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Factures</h4>

      <div class="flex flex-wrap items-center gap-2 justify-start sm:justify-end">

        <Button 
          label="Télécharger PDF"
          icon="pi pi-file-pdf"
           severity="info"
          class="p-button-success"
          @click="downloadPDFInvoices"
        />

        <Button 
          label="Supprimer sélection"
          icon="pi pi-trash"
          severity="danger"
          :disabled="selectedInvoices.length === 0"
          @click="deleteMultipleDialog = true"
        />
      </div>
    </div>

    <!-- Barre de recherche -->
    <div class="relative flex items-center w-full sm:w-72">
      <i class="pi pi-search absolute left-3 text-gray-400"></i>
      <InputText 
        v-model="filters['global'].value"
        placeholder="      Rechercher..."
        class="w-full pl-10 py-2"
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

  <Column header="Status" field="status" sortable style="max-width: 95px;">
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
