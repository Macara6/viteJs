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
import { clearAllCache, loadCache, saveCache } from '@/utils/cache';
import { FilterMatchMode } from '@primevue/core/api';
import html2canvas from 'html2canvas';
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
function exchangeRate(value){
  const rate = Number(userProfile.value?.exchange_rate || 1);
  const currency = userProfile.value?.currency_preference;
  if(currency ==="CDF"){
    return `${(value / rate).toFixed(2)} USD`;
  }
  if(currency ==="USD"){
    return `${(value * rate).toFixed(2)} CDF`
  }
  return value;
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
                icon="pi pi-file-pdf"
                class="btn-teal"
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

      <Column field="id" header="ID" sortable style="max-width: 60px">
        <template #body="slotProps">
          <span class="cell text-slate-500">{{ slotProps.data.id }}</span>
        </template>
      </Column>

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
          <span class="cell font-bold text-[#004D4A]">{{ formatPrice(slotProps.data.total_amount) }}</span>
        </template>
      </Column>

      <Column v-if="isSecretValidatedForView" field="profit_amount" header="Bénéfice" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell text-emerald-600 font-semibold">{{ formatPrice(slotProps.data.profit_amount) }}</span>
        </template>
      </Column>

      <Column field="change" header="Reste" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.change) }}</span>
        </template>
      </Column>

      <Column field="amount_paid" header="Payé" sortable style="max-width: 110px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.amount_paid) }}</span>
        </template>
      </Column>

      <Column field="tva" header="TVA" sortable style="max-width: 90px">
        <template #body="slotProps">
          <span class="cell">{{ formatPrice(slotProps.data.tva) || 'N/A' }}</span>
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
    <Dialog
          v-model:visible="showModal"
          modal
          :style="{ width: '95%', maxWidth: '860px', padding: 0 }"
          :showHeader="false"
        >
          <div id="cashout-pdf-content" class="invoice-shell">

            <!-- ══════════════ EN-TÊTE FACTURE ══════════════ -->
            <div class="invoice-header">

              <!-- Colonne gauche : infos entreprise -->
              <div class="company-info">
                <div class="company-name">
                  {{ userProfile?.entrep_name || 'Entreprise non définie' }}
                </div>
                <div class="company-meta">
                  <span><i class="pi pi-id-card"></i> ID Nat : {{ userProfile?.id_nat || '—' }}</span>
                  <span><i class="pi pi-file"></i> N° Impôt : {{ userProfile?.impot_number || '—' }}</span>
                  <span><i class="pi pi-briefcase"></i> RCCM : {{ userProfile?.rccm_number || '—' }}</span>
                  <span><i class="pi pi-map-marker"></i> {{ userProfile?.adress || '—' }}</span>
                  <span><i class="pi pi-phone"></i> {{ userProfile?.phone_number || '—' }}</span>
                  <span><i class="pi pi-dollar"></i> Devise : {{ userProfile?.currency_preference || '—' }}</span>
                </div>

                <div class="people-row">
                  <div class="person-tag">
                    <i class="pi pi-user"></i>
                    <span>{{ invoices.find(c => c.id === selectedInvoices)?.client_name || 'N/D' }}</span>
                    <em>Client</em>
                  </div>
                  <div class="person-tag">
                    <i class="pi pi-desktop"></i>
                    <span>{{ invoices.find(c => c.id === selectedInvoices)?.cashier_name || 'N/D' }}</span>
                    <em>Caissier</em>
                  </div>
                </div>
              </div>

              <!-- Colonne droite : numéro + statut -->
              <div class="invoice-meta">
                <div class="invoice-label">FACTURE</div>
                <div class="invoice-number">
                  {{ invoices.find(c => c.id === selectedInvoices)?.invoice_number || 'N/A' }}
                </div>

                <div class="invoice-detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">
                    {{ formatDate(invoices.find(c => c.id === selectedInvoices)?.created_at) || 'N/A' }}
                  </span>
                </div>

                <div class="invoice-detail-row">
                  <span class="detail-label">Statut</span>
                  <span
                    class="status-badge"
                    :class="invoices.find(c => c.id === selectedInvoices)?.status === 'VALIDE'
                      ? 'badge-valid' : 'badge-cancel'"
                  >
                    <i :class="invoices.find(c => c.id === selectedInvoices)?.status === 'VALIDE'
                      ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
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
                        🎁 Cadeau
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
                        🎁 Gratuit
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

                <div class="total-row">
                  <span class="total-label">Sous-total</span>
                  <div class="total-values">
                    <span class="total-main">
                      {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                      {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.total_amount) }}
                    </span>
                    <span class="total-conv">
                      ({{ exchangeRate(invoices.find(c => c.id === selectedInvoices)?.total_amount) }})
                    </span>
                  </div>
                </div>

                <div class="total-row tva">
                  <span class="total-label">TVA</span>
                  <div class="total-values">
                    <span class="total-main danger">
                      {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                      {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.tva) }}
                    </span>
                    <span class="total-conv">
                      ({{ exchangeRate(invoices.find(c => c.id === selectedInvoices)?.tva) }})
                    </span>
                  </div>
                </div>

                <div class="total-row final">
                  <span class="total-label bold">TOTAL TTC</span>
                  <div class="total-values">
                    <span class="total-main bold primary">
                      {{ invoices.find(c => c.id === selectedInvoices)?.cashier_currency || '' }}
                      {{ formatPrice(invoices.find(c => c.id === selectedInvoices)?.total_amount) }}
                    </span>
                    <span class="total-conv">
                      ({{ exchangeRate(invoices.find(c => c.id === selectedInvoices)?.total_amount) }})
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Remplace uniquement le bloc invoice-footer et ajoute le QR -->

<!-- ══════════════ PIED DE FACTURE ══════════════ -->
        <div class="invoice-bottom">

          <div class="bottom-left">

            <!-- Numéro facture en grand -->
            <div class="invoice-number-block">
              <span class="invoice-number-label">N° Facture</span>
              <span class="invoice-number-value">
                {{ invoices.find(c => c.id === selectedInvoices)?.invoice_number || 'N/A' }}
              </span>
            </div>

            <!-- Message + branding -->
            <div class="footer-bottom-row">
              <div class="footer-msg">
              
              Merci pour votre confiance !
              </div>
              <span class="footer-brand">Powered by BilaSol APP</span>
            </div>

          </div>

          <!-- QR Code -->
          <div class="qr-block">
            <div class="qr-box">
              <img
                :src="`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${
                  encodeURIComponent(
                    'Facture:#' + (invoices.find(c => c.id === selectedInvoices)?.invoice_number || '') +
                    '|Client:' + (invoices.find(c => c.id === selectedInvoices)?.client_name || '') +
                    '|Total:' + (invoices.find(c => c.id === selectedInvoices)?.total_amount || '')
                  )
                }`"
                alt="QR Code facture"
              />
            </div>
            <span class="qr-label">Scanner pour vérifier</span>
          </div>

        </div>

          </div>

          <!-- ══════════════ ACTION BAR ══════════════ -->
          <div class="action-bar">
            <button class="btn-close-modal" @click="showModal = false">
              <i class="pi pi-times"></i> Fermer
            </button>
            <button class="btn-download" @click="downloadPDF">
              <i class="pi pi-download"></i> Télécharger PDF
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


/* ── Shell ──────────────────────────────────────────────── */
.invoice-shell {
  font-family: 'Inter', system-ui, sans-serif;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

/* ══════════════ HEADER ══════════════ */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 28px 32px 24px;
  background: #ffffff;
  border-bottom: 2px solid #f1f5f9;
  flex-wrap: wrap;
}

.header-left-accent {
  width: 4px;
  height: 100%;
  min-height: 80px;
  background: linear-gradient(180deg, #6366f1, #4ade80);
  border-radius: 4px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex: 1;
}

.company-name {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin-bottom: 10px;
}

.company-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.company-meta span {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.company-meta .pi { font-size: 11px; color: #6366f1; }

.people-row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.person-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 12px;
  color: #374151;
}
.person-tag .pi { color: #6366f1; font-size: 12px; }
.person-tag em  { color: #94a3b8; font-style: normal; font-size: 10px; margin-left: 2px; }

/* Colonne droite header */
.invoice-meta {
  text-align: right;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.invoice-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 2.5px;
  text-transform: uppercase;
}

.invoice-detail-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
.detail-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
.detail-value {
  font-size: 12px;
  color: #1e293b;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.badge-valid  { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
.badge-cancel { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

/* ══════════════ BODY ══════════════ */
.invoice-body {
  padding: 24px 32px;
  background: #fff;
}

.table-wrapper {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}
.invoice-table :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-color: #f1f5f9 !important;
  padding: 10px 14px !important;
}
.invoice-table :deep(.p-datatable-tbody > tr > td) {
  border-color: #f8fafc !important;
  padding: 10px 14px !important;
  font-size: 13px;
  color: #374151;
}
.invoice-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: #fafbff !important;
}

.product-cell { display: flex; align-items: center; gap: 8px; }
.product-icon { color: #6366f1; font-size: 13px; }
.price-text   { color: #374151; font-weight: 500; }
.total-text   { color: #1e293b; font-weight: 700; }

.qty-badge {
  display: inline-flex;
  align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: #eef2ff; color: #6366f1;
  border-radius: 7px; font-size: 12px; font-weight: 700;
}
.gift-badge {
  font-size: 12px; font-weight: 600;
  color: #16a34a; background: #dcfce7;
  border-radius: 6px; padding: 3px 8px;
}

/* Totaux */
.totals-block {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex; flex-direction: column; gap: 10px;
  max-width: 380px;
  margin-left: auto;
}
.total-row {
  display: flex; justify-content: space-between; align-items: center;
}
.total-row.final {
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}
.total-label { font-size: 13px; color: #64748b; font-weight: 500; }
.total-label.bold { color: #1e293b; font-weight: 800; font-size: 14px; }
.total-values { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.total-main { font-size: 14px; font-weight: 700; color: #1e293b; }
.total-main.danger  { color: #dc2626; }
.total-main.primary { color: #6366f1; font-size: 16px; }
.total-main.bold    { font-weight: 800; }
.total-conv { font-size: 11px; color: #94a3b8; }

/* ══════════════ PIED DE FACTURE : N° + QR ══════════════ */
.invoice-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  gap: 20px;
  flex-wrap: wrap;
}

.bottom-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}

.invoice-number-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.invoice-number-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.invoice-number-value {
  font-size: 20px;
  font-weight: 800;
  color: #161617;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  letter-spacing: 1px;
}

.footer-bottom-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.footer-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.footer-msg .pi { color: #f43f5e; font-size: 12px; }
.footer-brand { font-size: 11px; color: #94a3b8; }

/* QR code container */
.qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.qr-box {
  width: 90px; height: 90px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.qr-box img { width: 80px; height: 80px; }
.qr-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  text-align: center;
}

/* ══════════════ ACTION BAR ══════════════ */
.action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
  border-radius: 0 0 16px 16px;
}
.btn-close-modal {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 9px;
  background: #f1f5f9; color: #64748b;
  font-size: 13px; font-weight: 600;
  border: none; cursor: pointer; transition: background .15s;
}
.btn-close-modal:hover { background: #e2e8f0; }

.btn-download {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 9px;
  background: #16a34a; color: #fff;
  font-size: 13px; font-weight: 700;
  border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(22,163,74,0.25);
  transition: background .15s;
}
.btn-download:hover { background: #15803d; }



</style>
