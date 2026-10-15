<script setup>
import {
  cancelInvoiceAPI,
  checkSecretKeyStatus,
  deleteInvoiceAPI,
  fetchInvoiceDetail,
  fetchInvoicesAllUsers,
  fetchUserProfilById,
  generateReportInvoicesPDFAPI,
  getUsersCreatedByMe
} from '@/service/Api';
import { clearAllCache, loadCache, saveCache } from '@/utils/cache';
import { FilterMatchMode } from '@primevue/core/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

import { formatDateForAPI } from '@/utils/formatters';

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
const selectedUserProfile = ref(null);
const isSecretValidatedForView = ref(false);

const cancelDialog = ref(false); // cancel invoice 
const invoiceToCancel = ref(null); //
const statusUser = localStorage.getItem('status');
// --- Helpers ---
const formatPrice = price => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
const formatDate = value => new Date(value).toLocaleString('fr-FR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });

// Profil de l'utilisateur sélectionné


async function loadSelectedUserProfile(userId) {
  if (!userId) {
    selectedUserProfile.value = userProfile.value; // fallback sur l'utilisateur connecté
    return;
  }

  try {
    const profileData = await fetchUserProfilById(userId);
    selectedUserProfile.value = Array.isArray(profileData) ? profileData[0] : profileData;
  } catch (err) {
    console.error('Erreur lors du chargement du profil :', err);
    selectedUserProfile.value = userProfile.value; // fallback
  }
}

watch(selectedUserFilter, (newUserId) => {

  loadSelectedUserProfile(newUserId);

});
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
    if (childrenData) {
  const childrenWithProfile = await Promise.all(childrenData.map(async child => {
    const profileData = await fetchUserProfilById(child.id);
    return {
      ...child,
      profile: Array.isArray(profileData) ? profileData[0] : profileData
    };
  }));

  userOptions.value = [
    { id: userProfile.value.id, username: userProfile.value.username, profile: userProfile.value },
    ...childrenWithProfile
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
    console.log('invoice detail :', invoiceDetails.value );
    console.log('invoice seletected :', selectedInvoices.value);
    showModal.value = true;
  } catch(err) {
    
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
 function verifySecret(result) {
  
  if(result !== true){
      toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Code secret invalide',
      life: 3000
    })
    return;
  }

   // const isValid = await verifySecretKey(secretKey.value);
      showSensitiveInfo.value = true;
      secretDialog.value = false;

      toast.add({ severity:'success', summary:'Succès', detail:'Code secret validé', life:3000 });
      
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
      secretKey.value ="";
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
    clearAllCache();
    await loadUserProfileAndChildren();
    toast.add({ severity: 'success', summary: 'Actualisé', detail: 'Les factures ont été rechargées', life: 3000 });
  } catch(err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de recharger les factures', life: 3000 });
  } finally {
    loading.value = false;
  }
}
// function pour coversion 
function exchangeRate(value,rate=null){
 
  const currency = userProfile.value?.currency_preference;
  if(currency ==="CDF"){
    return `${(value / rate).toFixed(2)} USD`;
  }
  if(currency ==="USD"){
    return `${(value * rate).toFixed(2)} CDF`
  }
  return value;
}

const isGenerating = ref(false);

  // Création du PDF en A4 vertical
 async function downloadPDFInvoices() {
 isGenerating.value = true;

 try{
    const pdfBlob = await generateReportInvoicesPDFAPI({
      user_id:selectedUserFilter.value,
      start_date: formatDateForAPI(startDate.value),
      end_date:formatDateForAPI(endDate.value) 
    })
    const blob = new Blob( [pdfBlob], { type: 'application/pdf' } );
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport_factures.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
 }catch(error){
   console.error( "Erreur lors du téléchargement du rapport :", error );
 }finally{
  isGenerating.value = false;
 }

  
}

async function downloadPDF() {
  const element = document.getElementById('cashout-pdf-content');
  if (!element) return;

  // Capture en haute résolution
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // ➤ Première page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // ➤ Si le contenu dépasse, on ajoute des pages
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(`facture_${selectedInvoices.value}.pdf`);
}

function calculateReduction(point){
  const userPointOut = userProfile.value.point_output;
  return point * userPointOut
}


// --- Mounted ---
onMounted(async () => {
  await loadUserProfileAndChildren();
  await checkSecretKey();
});

</script>





<template>
  <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50">

  <!-- Toolbar -->
  <div class="toolbar-card mb-5">
    <Toolbar class="flex flex-wrap justify-between items-center gap-3 p-4 border-none bg-transparent">

      <!-- Left -->
      <template v-if="statusUser == 'ADMIN'" #start>
        <Button
          label="Afficher Bénéfice"
          icon="pi pi-lock"
          severity="warning"
          outlined
          @click="openView"
        />
      </template>

      <!-- Right -->
      <template #end>
        <div class="flex flex-wrap items-center gap-3">

          <Select
            v-if="statusUser === 'ADMIN'"
            v-model="selectedUserFilter"
            :options="userOptions.filter(u => u.status !== 'GESTIONNAIRE_STOCK')"
            optionValue="id"
            optionLabel="username"
            placeholder="Filtrer par utilisateur"
            class="w-full sm:w-56"
            :showClear="userOptions.value != 0"
          >
            <template #option="{ option }">
              <div class="flex items-center justify-between w-full">
                <span>{{ option.username }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': option.status === 'ADMIN',
                    'bg-teal-50 text-[#004D4A]': option.status === 'CAISSIER',
                    'bg-slate-100 text-slate-500': option.status === 'GESTIONNAIRE_STOCK'
                  }"
                >
                  {{ option.status }}
                </span>
              </div>
            </template>

            <template #selectedItem="{ slotProps }">
              <div class="flex items-center gap-2">
                <span>{{ slotProps.username }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': slotProps.status === 'ADMIN',
                    'bg-teal-50 text-[#004D4A]': slotProps.status === 'CAISSIER'
                  }"
                >
                  {{ slotProps.status }}
                </span>
              </div>
            </template>
          </Select>

          <!-- Filtre dates -->
          <div class="date-filter-group">
            <div class="flex flex-col gap-1">
              <label class="date-filter-label">Date début</label>
              <Calendar
                v-model="startDate"
                dateFormat="yy-mm-dd"
                placeholder="Date début"
                showIcon
                :monthNavigator="true"
                :yearNavigator="true"
                :showButtonBar="true"
                class="w-full sm:w-44"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="date-filter-label">Date fin</label>
              <Calendar
                v-model="endDate"
                dateFormat="yy-mm-dd"
                placeholder="Date fin"
                showIcon
                :showTime="false"
                :monthNavigator="true"
                :yearNavigator="true"
                :showButtonBar="true"
                class="w-full sm:w-44"
              />
            </div>

            <button class="btn-reset-date" @click="resetDateFilter">
              <i class="pi pi-times text-xs"></i>
              Réinitialiser
            </button>
          </div>

          <Button
            label="Actualiser"
            icon="pi pi-refresh"
            class="btn-teal"
            @click="refreshInvoices"
          />
        </div>
      </template>
    </Toolbar>
  </div>

  <!-- DataTable Factures -->
  <div class="table-card">

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
      class="custom-datatable min-w-full"
    >

      <!-- HEADER -->
      <template #header>

        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner text-[#004D4A]" style="font-size: 2rem"></i>
          <p class="text-sm text-slate-400 mt-3 font-medium">Chargement des factures...</p>
        </div>

        <div v-else class="flex flex-col gap-4">

          <!-- Ligne du haut -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-[#004D4A]/8 flex items-center justify-center">
                <i class="pi pi-receipt text-[#004D4A] text-sm"></i>
              </div>
              <h4 class="m-0 text-base sm:text-lg font-bold text-slate-800">
                Table Factures
              </h4>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Button
                label="Télécharger PDF"
                icon="pi pi-file-export"
                class="btn-teal"
                :loading="isGenerating"
                @click="downloadPDFInvoices"
              />

              <Button
                v-if="statusUser == 'ADMIN'"
                label="Supprimer sélection"
                icon="pi pi-trash"
                severity="danger"
                outlined
                :disabled="selectedInvoices.length === 0"
                @click="deleteMultipleDialog = true"
              />
            </div>
          </div>

          <!-- Recherche -->
          <span class="relative flex items-center w-full sm:w-72">
            <i class="pi pi-search absolute left-3 text-slate-400 text-sm pointer-events-none"></i>
            <InputText
              v-model="filters['global'].value"
              placeholder="Rechercher une facture..."
              class="w-full !pl-9 !py-2.5 !text-sm !rounded-xl !border-slate-200
                     focus:!border-[#004D4A] focus:!ring-[#004D4A]/10"
            />
          </span>

        </div>
      </template>

      <!-- Colonnes -->
      <Column selectionMode="multiple" headerStyle="width: 40px" />

  
      <Column field="client_name" header="Client" sortable style="max-width: 130px">
        <template #body="slotProps">
          <span class="cell font-semibold text-slate-800">{{ slotProps.data.client_name }}</span>
        </template>
      </Column>

      <Column field="cashier_name" header="Caissier" sortable style="max-width: 120px">
        <template #body="slotProps">
          <span class="cell">{{ slotProps.data.cashier_name }}</span>
        </template>
      </Column>

      <Column field="total_amount" header="Total" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell font-bold text-[#004D4A]">{{ formatPrice(slotProps.data.amount_total) }}</span>
        </template>
      </Column>

      <Column v-if="isSecretValidatedForView" field="profit_amount" header="Bénéfice" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell text-emerald-600 font-semibold">{{ formatPrice(slotProps.data.profit_amount) }}</span>
        </template>
      </Column>

      <Column field="change" header="Réduc" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice( calculateReduction(slotProps.data.points_used)) }}</span>
        </template>
      </Column>

      <Column field="amount_paid" header="Payé" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.amount_paid) }}</span>
        </template>
      </Column>

      <Column field="amount_paid" header="Reste" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.change) }}</span>
        </template>
      </Column>


      <Column field="tva" header="TVA" sortable style="max-width: 90px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.tva) || 'N/A' }}</span>
        </template>
      </Column>
      <Column field="exchange_rate" header="Taux" sortable style="max-width: 90px">
       <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.exchange_rate) || 'N/A' }}</span>
        </template>
      </Column>

      <Column field="cashier_currency" header="Devise" sortable style="max-width: 70px">
        <template #body="slotProps">
          <span class="cell text-xs font-semibold text-slate-500">{{ slotProps.data.cashier_currency }}</span>
        </template>
      </Column>

      <Column field="created_at" header="Date" sortable style="max-width: 150px">
        <template #body="slotProps">
          <span class="cell">{{ formatDate(slotProps.data.created_at) }}</span>
        </template>
      </Column>

      <Column header="Status" field="status" sortable style="max-width: 95px">
        <template #body="slotProps">
          <span
            class="status-badge"
            :class="slotProps.data.status === 'ANNULER' ? 'status-badge--cancelled' : 'status-badge--valid'"
          >
            <i :class="slotProps.data.status === 'ANNULER' ? 'pi pi-ban' : 'pi pi-check-circle'" class="text-[10px]"></i>
            {{ slotProps.data.status }}
          </span>
        </template>
      </Column>

      <Column field="invoice_number" header="N° Ticket" sortable style="max-width: 150px">
        <template #body="slotProps">
          <div class="text-center font-mono text-xs text-slate-500">
            {{ slotProps.data.invoice_number || 'N/A' }}
          </div>
        </template>
      </Column>

      <Column header="Actions" style="max-width: 160px">
        <template #body="slotProps">
          <div class="flex justify-center gap-1.5">
            <button
              v-if="statusUser == 'ADMIN'"
              class="action-btn action-btn--delete"
              @click="confirmDeleteInvoice(slotProps.data)"
              title="Supprimer"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>

            <button
              class="action-btn action-btn--view"
              @click="ViewDetailInvoice(slotProps.data.id)"
              title="Voir détails"
            >
              <i class="pi pi-eye text-xs"></i>
            </button>

            <button
              v-if="statusUser == 'ADMIN'"
              class="action-btn action-btn--cancel"
              @click="confirmCancelInvoice(slotProps.data)"
              title="Annuler"
            >
              <i class="pi pi-ban text-xs"></i>
            </button>
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

    <SecretCodeDialog
      v-model:visible="secretDialog"
      title="Facture"
      message="Entrez votre code secret pour continuer"
      @verified="verifySecret"
    />
        <Dialog
          v-model:visible="showModal"
          modal
          :style="{ width: '95%', maxWidth: '420px', padding: 0 }"
          :showHeader="false"
        >
          <div id="cashout-pdf-content" class="invoice-shell">
 
            <!-- ══════════════ EN-TÊTE ══════════════ -->
            <div class="invoice-header">
 
              <div class="company-info">
                <div class="company-name">
                  {{ userProfile?.entrep_name || 'Entreprise non définie' }}
                </div>
                <div class="company-meta">
                  <span>{{ userProfile?.adress || '—' }}</span>
                  <span>Tél : {{ userProfile?.phone_number || '—' }}</span>
                  <span>ID Nat : {{ userProfile?.id_nat || '—' }}</span>
                  <span>N° Impôt : {{ userProfile?.impot_number || '—' }}</span>
                  <span>RCCM : {{ userProfile?.rccm_number || '—' }}</span>
                  <span>Devise : {{ userProfile?.currency_preference || '—' }}</span>
                  <span>Taux : {{ invoices.find(c => c.id === selectedInvoices)?.exchange_rate || '—' }}</span>
                </div>
              </div>
 
              <div class="invoice-meta">
                <div class="invoice-label">FACTURE</div>
 
                <div class="invoice-detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">
                    {{ formatDate(invoices.find(c => c.id === selectedInvoices)?.created_at) || 'N/A' }}
                  </span>
                </div>
 
                <div class="invoice-detail-row">
                  <span class="detail-label">Client</span>
                  <span class="detail-value">
                    {{ invoices.find(c => c.id === selectedInvoices)?.client_name || 'N/D' }}
                  </span>
                </div>
 
                <div class="invoice-detail-row">
                  <span class="detail-label">Caissier</span>
                  <span class="detail-value">
                    {{ invoices.find(c => c.id === selectedInvoices)?.cashier_name || 'N/D' }}
                  </span>
                </div>
 
                <div class="invoice-detail-row">
                  <span class="detail-label">Statut</span>
                  <span
                    class="status-badge"
                    :class="invoices.find(c => c.id === selectedInvoices)?.status === 'VALIDE'
                      ? 'badge-valid' : 'badge-cancel'"
                  >
                    {{ invoices.find(c => c.id === selectedInvoices)?.status || 'N/A' }}
                  </span>
                </div>
              </div>
 
            </div>
 
            <!-- ══════════════ TABLE PRODUITS ══════════════ -->
            <div class="invoice-body">
              <div v-if="invoiceDetails.length > 0" class="table-wrapper">
                <DataTable
                  :value="invoiceDetails"
                  class="invoice-table"
                  size="small"
                >
 
                  <Column field="product_name" header="Produit" style="min-width:160px">
                    <template #body="slotProps">
                      <div class="product-cell">
                        <span class="font-semibold text-gray-800">{{ slotProps.data.product_name }}</span>
                      </div>
                    </template>
                  </Column>
 
                  <Column field="price" header="Prix U." style="min-width:100px">
                    <template #body="slotProps">
                      <span v-if="slotProps.data.is_gift" class="gift-badge">
                        Cadeau
                      </span>
                      <span v-else class="price-text">
                        {{ userProfile?.currency_preference }}
                        {{ formatPrice(slotProps.data.price) }}
                      </span>
                    </template>
                  </Column>
 
                  <Column field="quantity" header="Qté" style="width:70px; text-align:center">
                    <template #body="slotProps">
                      <span class="qty-badge">{{ slotProps.data.quantity }}</span>
                    </template>
                  </Column>
 
                  <Column header="Total" style="min-width:110px">
                    <template #body="slotProps">
                      <span v-if="slotProps.data.is_gift" class="gift-badge">
                        Gratuit
                      </span>
                      <span v-else class="total-text">
                        {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                        {{ formatPrice(slotProps.data.price * slotProps.data.quantity) }}
                      </span>
                    </template>
                  </Column>
 
                </DataTable>
              </div>
 
              <!-- ══════════════ TOTAUX ══════════════ -->
              <div class="totals-block">
 
                <div class="totals-grid">
 
                  <div class="totals-col totals-col--details">
 
                    <div class="total-row">
                      <span class="total-label">Sous-total</span>
                      <div class="total-values">
                        <span class="total-main">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.amount_total) }}
                        </span>
                        <span class="total-conv">
                          ({{ 
                            exchangeRate(
                            invoices.find(c => c.id === selectedInvoices)?.amount_total, 
                            invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                            ) 
                          }})
                        </span>
                      </div>
                    </div>
 
                    <div class="total-row">
                      <span class="total-label">Réduction</span>
                      <div class="total-values">
                        <span class="total-main">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ formatPrice(calculateReduction(invoices.find(c => c.id === selectedInvoices)?.points_used)) }}
                        </span>
                        <span class="total-conv">
                          ({{ 
                            exchangeRate(
                              calculateReduction(invoices.find(c => c.id === selectedInvoices)?.points_used),
                              invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                              ) 
                            
                            }})
                        </span>
                      </div>
                    </div>
 
                    <div class="total-row tva">
                      <span class="total-label">TVA</span>
                      <div class="total-values">
                        <span class="total-main danger">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ 
                            formatPrice(invoices.find(c => c.id === selectedInvoices)?.tva)
                          }}
                        </span>
                        <span class="total-conv">
                          ({{ 
                            exchangeRate(invoices.find(c => c.id === selectedInvoices)?.tva,
                             invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                             ) 
                            }})
                        </span>
                      </div>
                    </div>
 
                  </div>
 
                  <div class="totals-col totals-col--summary">
 
                    <div class="total-row final">
                      <span class="total-label bold">TOTAL TTC</span>
                      <div class="total-values">
                        <span class="total-main bold primary">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.total_amount) }}
                        </span>
                        <span class="total-conv">
                          ({{
                             exchangeRate(invoices.find(c => c.id === selectedInvoices)?.total_amount,
                             invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                             ) 
                          }})
                        </span>
                      </div>
                    </div>
 
                    <div class="total-row">
                      <span class="total-label bold">Montant perçu</span>
                      <div class="total-values">
                        <span class="total-main bold">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.amount_paid) }}
                        </span>
                        <span class="total-conv">
                          ({{ 
                            exchangeRate(invoices.find(c => c.id === selectedInvoices)?.amount_paid,
                            invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                            ) 
                          
                          }})
                        </span>
                      </div>
                    </div>
 
                    <div class="total-row">
                      <span class="total-label bold">Reste</span>
                      <div class="total-values">
                        <span class="total-main bold success">
                          {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                          {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.change) }}
                        </span>
                        <span class="total-conv">
                          ({{ exchangeRate(invoices.find(c => c.id === selectedInvoices)?.change,
                          invoices.find(c => c.id === selectedInvoices)?.exchange_rate
                          ) 
                          
                          }})
                        </span>
                      </div>
                    </div>
 
                  </div>
 
                </div>
 
              </div>
 
            </div>
 
            <!-- ══════════════ PIED : QR + N° FACTURE ══════════════ -->
            <div class="invoice-bottom">
 
              <div class="bottom-left">
 
                <div class="invoice-number-block">
                  <span class="invoice-number-label">N° Facture</span>
                  <span class="invoice-number-value">
                    {{ invoices.find(c => c.id === selectedInvoices)?.invoice_number || 'N/A' }}
                  </span>
                </div>
 
                <div class="footer-bottom-row">
                  <div class="footer-msg">
                    Merci pour votre confiance !
                  </div>
                  <span class="footer-brand">Powered by BilaSol APP</span>
                </div>
 
              </div>
 
            </div>
 
          </div>
 
          <!-- ══════════════ ACTION BAR ══════════════ -->
          <div class="action-bar">
            <button class="btn-close-modal" @click="showModal = false">
              Fermer
            </button>
            <button class="btn-download" @click="downloadPDF">
              Télécharger PDF
            </button>
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
<style scoped>

.toolbar-card {
    background-color: #fff;
    border-radius: 16px;
    border: 1.5px solid #f1f5f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.table-card {
    background-color: #fff;
    border-radius: 16px;
    border: 1.5px solid #f1f5f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    padding: 1.25rem;
    overflow-x: auto;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 0;
}

/* Filtre dates */
.date-filter-group {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    padding: 0.5rem;
    background-color: #f8fafc;
    border-radius: 12px;
    border: 1.5px solid #f1f5f9;
}

.date-filter-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.btn-reset-date {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #ef4444;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    transition: all 0.15s ease;
}

.btn-reset-date:hover {
    background-color: #ef4444;
    color: #fff;
}

/* Boutons */
.btn-teal {
    background-color: #004D4A !important;
    border-color: #004D4A !important;
}
.btn-teal:hover {
    background-color: #006660 !important;
    border-color: #006660 !important;
}

/* Status badge */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.65rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
}

.status-badge--valid {
    background-color: #ecfdf5;
    color: #059669;
}

.status-badge--cancelled {
    background-color: #fef2f2;
    color: #dc2626;
}

/* Action buttons */
.action-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
}

.action-btn--view {
    background-color: #f0faf9;
    color: #004D4A;
    border-color: rgba(0, 77, 74, 0.15);
}
.action-btn--view:hover {
    background-color: #004D4A;
    color: #fff;
}

.action-btn--delete {
    background-color: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}
.action-btn--delete:hover {
    background-color: #dc2626;
    color: #fff;
}

.action-btn--cancel {
    background-color: #fffbeb;
    color: #d97706;
    border-color: #fde68a;
}
.action-btn--cancel:hover {
    background-color: #d97706;
    color: #fff;
}

/* DataTable refinement */
.custom-datatable :deep(.p-datatable-thead > tr > th) {
    background-color: #f8fafc;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-color: #f1f5f9;
}

.custom-datatable :deep(.p-datatable-tbody > tr:hover) {
    background-color: #f8fafc;
}

.custom-datatable :deep(.p-paginator) {
    background-color: transparent;
    border-top: 1px solid #f1f5f9;
    margin-top: 0.5rem;
    padding-top: 1rem;
}

.cell {
    font-size: 0.82rem;
}

/* ════════════════════════════════════════════════
   TICKET DE CAISSE — noir / gris / blanc uniquement
   ════════════════════════════════════════════════ */
 
.invoice-shell {
  --ink: #111;
  --muted: #5f5f5f;
  --line: #d6d6d6;
 
  background: #fff;
  color: var(--ink);
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  padding: 30px 26px 26px;
}
 
/* ───────── En-tête ───────── */
.invoice-header {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
 
.company-info { text-align: center; }
 
.company-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
 
.company-meta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.7;
}
 
/* Bloc infos facture */
.invoice-meta {
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}
 
.invoice-label {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 4px;
  margin-bottom: 10px;
}
 
.invoice-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 3px 0;
}
.detail-label {
  color: var(--muted);
  font-size: 14px;
}
.detail-value {
  font-weight: 600;
  text-align: right;
}
 
.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 1px 12px;
  border: 1px solid var(--ink);
  border-radius: 999px;
}
.badge-valid { background: #fff; color: var(--ink); }
.badge-cancel { background: #fff; color: var(--ink); text-decoration: line-through; }
 
/* ───────── Corps ───────── */
.invoice-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}
 
/* ───────── Table produits ───────── */
.table-wrapper { overflow-x: auto; }
 
.invoice-table :deep(.p-datatable-table-container),
.invoice-table :deep(.p-datatable-wrapper) { background: transparent; }
 
.invoice-table :deep(table) { width: 100%; }
 
.invoice-table :deep(th),
.invoice-table :deep(td) {
  min-width: 0 !important;
  width: auto !important;
  background: transparent !important;
  color: var(--ink) !important;
  border: 0 !important;
  border-bottom: 1px dashed var(--line) !important;
  padding: 8px 4px !important;
  font-size: 14px;
  vertical-align: top;
}
 
.invoice-table :deep(th) {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted) !important;
  text-align: left;
  border-bottom: 1px solid var(--ink) !important;
  padding-top: 0 !important;
}
 
.invoice-table :deep(th:nth-child(n+2)),
.invoice-table :deep(td:nth-child(n+2)) {
  text-align: right;
  white-space: nowrap;
}
.invoice-table :deep(.p-datatable-column-header-content) { justify-content: inherit; }
.invoice-table :deep(tr:last-child td) { border-bottom: 0 !important; }
 
.product-cell { word-break: break-word; }
.product-cell span { font-weight: 600; color: var(--ink) !important; }
 
.price-text,
.qty-badge {
  background: none;
  border: 0;
  padding: 0;
  color: var(--ink);
  font-weight: 400;
}
.total-text {
  background: none;
  border: 0;
  padding: 0;
  color: var(--ink);
  font-weight: 600;
}
.gift-badge {
  background: none;
  border: 0;
  padding: 0;
  color: var(--ink);
  font-style: italic;
}
 
/* ───────── Totaux ───────── */
.totals-block { margin-top: 14px; }
.totals-grid { display: block; }
.totals-col { display: block; }
 
.totals-col--details {
  padding-top: 12px;
  border-top: 1px solid var(--ink);
}
 
/* Toutes les lignes ont la même structure */
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
}
.total-label { color: var(--muted); font-weight: 400; }
.total-label.bold { color: var(--muted); font-weight: 400; }
 
.total-values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.total-main { color: var(--ink); font-weight: 600; }
.total-main.bold { font-weight: 600; }
.total-main.danger,
.total-main.success,
.total-main.primary { color: var(--ink); }
.total-conv { font-size: 12px; color: var(--muted); font-weight: 400; }
 
/* Résumé : séparé par un trait fin */
.totals-col--summary {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}
 
/* TOTAL TTC : simple, juste plus grand et en gras */
.total-row.final { padding: 6px 0 10px; align-items: center; }
.total-row.final .total-label,
.total-row.final .total-main {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}
.total-row.final .total-conv { color: var(--muted); }
 
/* ───────── Pied ───────── */
.invoice-bottom {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
 
.qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.qr-box { background: #fff; border: 0; padding: 0; }
.qr-box img { width: 96px; height: 96px; display: block; }
.qr-label { font-size: 12px; color: var(--muted); }
 
.bottom-left { width: 100%; }
 
/* N° de facture : tout en bas */
.invoice-number-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0;
  margin-bottom: 14px;
  
  border-bottom: 1px solid var(--ink);
}
.invoice-number-label { font-size: 12px; color: var(--muted); }
.invoice-number-value {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  word-break: break-all;
}
 
.footer-bottom-row { display: flex; flex-direction: column; gap: 2px; }
.footer-msg { font-weight: 600; }
.footer-brand { font-size: 12px; color: var(--muted); }
 
/* ───────── Boutons (hors PDF) ───────── */
.action-bar {
  display: flex;
  gap: 8px;
  padding: 12px 0 0;
}
.btn-close-modal,
.btn-download {
  flex: 1;
  padding: 11px 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #111;
}
.btn-close-modal { background: #fff; color: #111; }
.btn-download { background: #111; color: #fff; }
.btn-close-modal:focus-visible,
.btn-download:focus-visible { outline: 2px solid #111; outline-offset: 2px; }
/* Responsive : repasse en une colonne sur petit écran */
@media (max-width: 480px) {
  .totals-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .totals-col--details {
    border-right: none;
    border-bottom: 1px dashed #e5e7eb;
    padding-right: 0;
    padding-bottom: 0.5rem;
  }

  .totals-col--summary {
    padding-left: 0;
  }
}


</style>
