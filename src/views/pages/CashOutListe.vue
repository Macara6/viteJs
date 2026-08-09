


<script setup>
import {
  deleteCashout,
  fetchCashOut,
  fetchCashOutDetail,
  fetchUserProfilById,
  fetchUsers,
  getUsersCreatedByMe,
} from '@/service/Api';

import { formatDate } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const dialogWidth = computed(() => {
  if (window.innerWidth < 640) return "95vw"; // téléphone
  if (window.innerWidth < 1024) return "80vw"; // tablette
  return "50vw"; // ordinateur
});


const userId = localStorage.getItem('id');
const isSuperUser = localStorage.getItem('is_superuser') === 'true';
const signatureUrl = '/demo/SignatureDe.png';

const cashoutList = ref([]);
const usersMap = ref({});
const selectedCashout = ref(null);
const cashoutDetails = ref([]);
const showModal = ref(false);
const deleteCashOutDialog = ref(false);
const selectedCashoutToDelete = ref(null);
const toast = useToast();
const userProfile = ref(null);
const selectedUserFilter = ref(null);
const childUsers = ref([]);

const startDate = ref(null);
const endDate = ref(null);



onMounted(async () => {
  await getUserChildren();
  selectedUserFilter.value = userId;
  await loadCashOutAndUser(1);

});




const filterdCashOut = computed(() => {
  return cashoutList.value.filter(item => {
    const created = new Date(item.created_at);
    const start = startDate.value? new Date(startDate.value): null;
    const end = endDate.value? new Date(endDate.value): null;
    if(start && end) return created >= start && created <= end;
    if(start) return created >= start;
    if(end) return created >= end;
    return true;
  })
})

const totalAmountCDF = ref(0);

const totalAmountUSD = ref(0);
  

function resetDates(){
  startDate.value =null;
  endDate.value = null;
}

async function refreshUserData() {
  await Promise.all([fetchUserProfil(), loadCashOutAndUser()]);
}

/* ===================== Récupérer les enfants ===================== */
async function getUserChildren() {
  try {
    const allCreatedUsers = await getUsersCreatedByMe();
    childUsers.value = allCreatedUsers;
  } catch (error) {
    console.error('Erreur getUserChildren', error);
  }
}

/* ===================== Charger les cashouts ===================== */
const currentPage = ref(1);
const pageSize = ref(50);
const totalCashouts = ref(0);
const loadingCashouts = ref(false);


const totalPages = computed(() =>
  Math.ceil(totalCashouts.value / 50)
);

const canGoPrevious = computed(() => currentPage.value > 1);

const canGoNext = computed(() => currentPage.value < totalPages.value);

async function loadCashOutAndUser(page = 1) {
  if (loadingCashouts.value) return;

  try {
    loadingCashouts.value = true;
    currentPage.value = page;

    const activeUserId = selectedUserFilter.value || userId;

    const [cashoutData, users] = await Promise.all([
      fetchCashOut(activeUserId, currentPage.value),
      fetchUsers()
    ]);

    usersMap.value = users.reduce((acc, user) => {
      acc[user.id] = user.username;
      return acc;
    }, {});

    cashoutList.value = cashoutData.results.map(cashout => ({
      ...cashout,
      user_name: usersMap.value[cashout.user] || 'Inconnu'
    }));

    totalCashouts.value = cashoutData.count;
    totalAmountUSD.value = cashoutData.total_usd;
    totalAmountCDF.value = cashoutData.total_cdf;

  } catch (error) {
    console.error('Erreur lors du chargement des bons de sortie:', error);
  } finally {
    loadingCashouts.value = false;
  }
}

function goToPreviousPage() {
  if (canGoPrevious.value) {
    loadCashOutAndUser(currentPage.value - 1);
  }
}

function goToNextPage() {
  if (canGoNext.value) {
    loadCashOutAndUser(currentPage.value + 1);
  }
}

function resetCashoutPagination() {
  loadCashOutAndUser(1);
}












/* =====================  Charger le profil utilisateur actif ===================== */
async function fetchUserProfil() {
  const activeUserId = selectedUserFilter.value || userId;
  try {
    const result = await fetchUserProfilById(activeUserId);
    userProfile.value = Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur', error);
  }
}

/* =====================  Voir les détails ===================== */
async function ViewDetailCashout(cashoutId) {
  try {
    const details = await fetchCashOutDetail(cashoutId);
    selectedCashout.value = cashoutId;
    cashoutDetails.value = details;
    showModal.value = true;
  } catch (error) {
    console.log('Erreur lors de la récupération des détails du bon', error);
  }
}

/* =====================  PDF ===================== */
async function downloadPDF() {
  const element = document.getElementById('cashout-pdf-content');
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`bon_sortie_${selectedCashout.value}.pdf`);
}


/* ===================== Suppression ===================== */
function deleteToCahOut(cashout) {
  selectedCashoutToDelete.value = cashout;
  deleteCashOutDialog.value = true;
}

async function confirmDeleteCashout() {
  try {
    if (!selectedCashoutToDelete.value) return;

    await deleteCashout(selectedCashoutToDelete.value.id);
    cashoutList.value = cashoutList.value.filter(
      c => c.id !== selectedCashoutToDelete.value.id
    );

    deleteCashOutDialog.value = false;
    selectedCashoutToDelete.value = null;
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Bon supprimé', life: 3000 });
  } catch (error) {
    console.error('Erreur lors de la suppression du bon de sortie:', error);
  }
}

/* =====================  Fonctions utilitaires ===================== */


function calculateTotal() {
  return cashoutDetails.value.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
}

/* =====================  Détection du changement d’utilisateur ===================== */
watch(selectedUserFilter, async () => {
  await refreshUserData();
});

const findUser = (id) => {
  if (!Array.isArray(childUsers.value)) return null; // sécurité
  return childUsers.value.find(u => u.id === id) || null;
};


</script>


<template>
  <div class="p-4 md:p-6">
    <div class="card shadow-sm rounded-xl border border-gray-100 bg-white">

      <!-- En-tête de la page -->
      <div class="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Liste des Dépenses</h1>
          <p class="text-sm text-gray-400 mt-1">Suivi et gestion des dépasses de caisse</p>
        </div>
      </div>

    <div class="cashout-table-container ">
     
          <DataTable
            ref="cashoutTable"
            :value="filterdCashOut"
            scrollable
            scrollHeight="400px"
            class="mt-2"
            :filters="filters"
            stripedRows
          >

            <template #header>
              <div class="flex flex-col gap-5 px-2 py-3">

                <!-- Ligne 1 : Actions + Filtres de date -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                  <div class="flex flex-wrap gap-3 items-center">
                    <RouterLink to="/pages/CreateCashout">
                      <Button
                        label="Nouveau Dépasse"
                        icon="pi pi-plus"
                        class="shadow-sm"
                      />
                    </RouterLink>

                    <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                      <Calendar
                        v-model="startDate"
                        placeholder="Date début"
                        date-format="yy-mm-dd"
                        show-icon
                        class="w-40"
                      />
                      <i class="pi pi-arrow-right text-gray-400 text-xs"></i>
                      <Calendar
                        v-model="endDate"
                        placeholder="Date fin"
                        date-format="yy-mm-dd"
                        show-icon
                        class="w-40"
                      />
                      <Button
                        icon="pi pi-refresh"
                        class="p-button-text p-button-secondary"
                        v-tooltip.top="'Réinitialiser les dates'"
                        @click="resetDates"
                      />
                    </div>
                  </div>

                  <!-- Filtre utilisateur + recherche -->
                  <div class="flex flex-wrap gap-3 items-center justify-end w-full lg:w-auto">
                    <Select v-if="!isSuperUser"
                      v-model="selectedUserFilter"
                      @change="resetCashoutPagination"
                      :options="childUsers.map(u => ({
                        id: u.id,
                        username: u.username,
                        status: u.status
                      })).filter(u => u.status !== 'GESTIONNAIRE_STOCK')"
                      optionLabel="username"
                      optionValue="id"
                      placeholder="Sélectionner utilisateur"
                      class="w-full sm:w-60"
                      showClear
                    >
                      <template #option="slotProps">
                        <div class="flex items-center justify-between w-full">
                          <span class="text-sm">{{ slotProps.option.username }}</span>
                          <span
                            class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                            :class="{
                              'bg-green-100 text-green-700': slotProps.option.status === 'ADMIN',
                              'bg-blue-100 text-blue-700': slotProps.option.status === 'CAISSIER',
                              'bg-gray-200 text-gray-700': slotProps.option.status === 'GESTIONNAIRE_STOCK'
                            }"
                          >
                            {{ slotProps.option.status }}
                          </span>
                        </div>
                      </template>

                      <template #seletectItem="slotProps">
                        <div v-if="slotProps.value" class="flex items-center gap-2">
                          <span class="text-sm">{{ slotProps.value.username }}</span>
                          <span
                            class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                            :class="{
                              'bg-green-100 text-green-700': slotProps.value.status === 'ADMIN',
                              'bg-blue-100 text-blue-700': slotProps.value.status === 'CAISSIER'
                            }"
                          >
                            {{ slotProps.value.status }}
                          </span>
                        </div>
                        <span v-else class="text-sm text-gray-400">Sélectionner utilisateur</span>
                      </template>
                    </Select>

                    <span class="relative flex items-center w-full sm:w-64">
                      <i
                        v-if="!filters['global'].value"
                        class="pi pi-search absolute left-3 text-gray-400 text-sm"
                      ></i>
                      <InputText
                        v-model="filters['global'].value"
                        placeholder="       Rechercher..."
                        class="w-full pl-9 py-2 text-sm rounded-lg"
                      />
                    </span>
                  </div>
                </div>

                <!-- Ligne 2 : Totaux sous forme de cartes -->
                <div class="flex flex-wrap gap-4">
                  <div class="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 min-w-[180px]">
                    <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                      <i class="pi pi-money-bill text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Total CDF</div>
                      <div class="text-base font-bold text-green-700">{{ totalAmountCDF }}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 min-w-[180px]">
                    <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <i class="pi pi-dollar text-blue-600 text-sm"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Total USD</div>
                      <div class="text-base font-bold text-blue-700">{{ totalAmountUSD }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <Column field="id" header="ID" style="min-width: 90px">
              <template #body="slotProps">
                <span class="text-gray-500 font-mono text-sm">{{ slotProps.data.id }}</span>
              </template>
            </Column>

            <Column field="total_amount" header="TOTAL" style="min-width: 200px">

             

              <template #body="slotProps">
                <span class="font-semibold text-gray-800">
                  {{ slotProps.data.total_amount }}
                  {{ slotProps.data.currency || (userProfile ? userProfile.currency_preference : "N/A") }}

                </span>
              </template>

            </Column>

            <Column field="motif" header="DEMANDEUR" style="min-width: 200px">
              <template #body="slotProps">
                <span class="text-gray-700">{{ slotProps.data.motif }}</span>
              </template>
            </Column>

            <Column field="created_at" header="DATE" style="min-width: 200px">
              <template #body="slotProps">
                <span class="text-gray-500 text-sm">
                  <i class="pi pi-calendar mr-1 text-xs"></i>
                  {{ formatDate(slotProps.data.created_at) }}
                </span>
              </template>
            </Column>

            <Column field="user_name" header="DONATEUR" style="min-width: 200px">
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
                    {{ slotProps.data.user_name?.charAt(0)?.toUpperCase() }}
                  </div>
                  <span class="text-gray-700 text-sm">{{ slotProps.data.user_name }}</span>
                </div>
              </template>
            </Column>

            <Column header="ACTION" style="min-width: 130px">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-eye"
                    class="p-button-sm p-button-rounded p-button-outlined p-button-info"
                    v-tooltip.top="'Voir le détail'"
                    @click="ViewDetailCashout(slotProps.data.id)"
                  />
                  <Button
                    icon="pi pi-trash"
                    class="p-button-sm p-button-rounded p-button-outlined"
                    severity="danger"
                    v-tooltip.top="'Supprimer'"
                    @click="deleteToCahOut(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
         
         <div class="flex items-center justify-between gap-3 py-3">
          <Button
            label="Précédent"
            icon="pi pi-chevron-left"
            :disabled="!canGoPrevious || loadingCashouts"
            @click="goToPreviousPage"
          />

          <span class="text-sm text-gray-500">
            Page {{ currentPage }} / {{ totalPages || 1 }}
            - {{ totalCashouts }} bons de sortie
          </span>

          <Button
            label="Suivant"
            icon="pi pi-chevron-right"
            iconPos="right"
            :disabled="!canGoNext || loadingCashouts"
            @click="goToNextPage"
          />
        </div>
       
        </div>

    </div>
  
   <!-- Dialog responsive -->
    <Dialog
      v-model:visible="showModal"
      modal
      header="Détails du bon de sortie"
      :style="{ width: dialogWidth }"
      class="responsive-dialog"
    >
      <div
        class="p-6 md:p-8 overflow-y-auto max-h-[70vh] space-y-6 bg-white"
        id="cashout-pdf-content"
      >
        <!-- En-tête -->
        <div class="flex justify-between items-start gap-6 pb-6 border-b border-gray-200 mb-6">

          <div class="text-left flex-2 space-y-1">
            <template v-if="isSuperUser">
              <h2 class="text-xl font-bold text-gray-800 tracking-wide">BILATECH S.A.R.L.U</h2>
              <p class="text-sm md:text-base text-gray-500">
                KINSHASA, NGALIEMA, PIGEON, AV: NIWA, N°25
              </p>
            </template>

            <template v-else>
              <h2 class="text-xl font-bold text-gray-800">
                {{ userProfile ? userProfile.entrep_name : "Non défini" }}
              </h2>
              <div class="text-sm md:text-base text-gray-500 space-y-0.5">
                <p><span class="text-gray-400">ID.Nat :</span> {{ userProfile ? userProfile.id_nat : "Non défini" }}</p>
                <p><span class="text-gray-400">Numéro Impôt :</span> {{ userProfile ? userProfile.impot_number : "Non défini" }}</p>
                <p><span class="text-gray-400">RCCM :</span> {{ userProfile ? userProfile.rccm_number : "Non défini" }}</p>
                <p><span class="text-gray-400">Adresse :</span> {{ userProfile ? userProfile.adress : "Non défini" }}</p>
                <p><span class="text-gray-400">Tél :</span> {{ userProfile ? userProfile.phone_number : "Non défini" }}</p>
                <p>
                  <span class="text-gray-400">Devise :</span>
                  {{ cashoutList.find((c) => c.id === selectedCashout)?.currency || "N/A" }}
                </p>
              </div>
            </template>

            <p class="text-sm md:text-base text-gray-500 pt-2">
              Date : {{ formatDate(new Date()) }}
            </p>

            <div class="pt-3 space-y-1">
              <h3 class="text-base md:text-lg font-semibold text-gray-800">
                Bon de sortie N°
                <span class="text-primary-600">000{{ selectedCashout }}</span>
              </h3>
              <h3 class="text-base md:text-lg font-medium text-gray-700">
                Demandeur :
                <span class="font-normal text-gray-600">
                  {{ cashoutList.find((c) => c.id === selectedCashout)?.motif || "N/A" }}
                </span>
              </h3>
            </div>
          </div>

          <img
            v-if="isSuperUser"
            src="/demo/bila.png"
            alt="Logo"
            class="h-24 md:h-32 lg:h-40 object-contain"
          />
        </div>

        <!-- Table des détails -->
        <div v-if="cashoutDetails.length > 0">
          <div class="rounded-lg border border-gray-200 overflow-hidden mb-6">
            <DataTable
              :value="cashoutDetails"
              responsiveLayout="scroll"
              stripedRows
              class="text-sm"
            >
              <Column field="id" header="ID" style="width: 100px">
                <template #body="slotProps">
                  <span class="text-gray-500 font-mono">#{{ slotProps.data.id }}</span>
                </template>
              </Column>

              <Column field="reason" header="Motif">
                <template #body="slotProps">
                  <span class="text-gray-700">{{ slotProps.data.reason }}</span>
                </template>
              </Column>

              <Column field="amount" header="Montant" style="min-width: 150px">
                <template #body="slotProps" v-if="isSuperUser">
                  <span class="font-semibold text-gray-800"> {{ slotProps.data.amount }}  {{ cashoutList.find((c) => c.id === selectedCashout)?.currency || "N/A" }}</span>
                </template>
                <template #body="slotProps" v-else>
                  <span class="font-semibold text-gray-800">
                    {{ slotProps.data.amount }}
                    {{ cashoutList.find((c) => c.id === selectedCashout)?.currency || "N/A" }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </div>

          <!-- Total -->
          <div class="flex justify-end mb-6">
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 min-w-[220px]">
              <div v-if="isSuperUser" class="flex justify-between items-center gap-6">
                <span class="text-sm text-gray-500 font-medium">Total</span>
                <span class="text-base md:text-lg font-bold text-gray-800">
                  {{ calculateTotal() }} USD
                </span>
              </div>
              <div v-else class="flex justify-between items-center gap-6">
                <span class="text-sm text-gray-500 font-medium">Total</span>
                <span class="text-base md:text-lg font-bold text-gray-800">
                  {{ calculateTotal() }}
                  {{ cashoutList.find((c) => c.id === selectedCashout)?.currency || "N/A" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Signature -->
          <div v-if="isSuperUser" class="flex justify-end mt-10 pt-6 border-t border-gray-100">
            <div class="text-center">
              <img
                :src="signatureUrl"
                alt="Signature"
                class="h-36 w-auto mx-auto"
                style="object-fit: contain;"
              />
              <div class="mt-2 pt-2 border-t border-gray-300">
                <p class="text-sm font-medium text-gray-700">Mr DELOR Musangania</p>
                <p class="text-xs text-gray-500">PDG BILATECH</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun détail -->
        <div v-else class="flex flex-col items-center justify-center text-center text-gray-400 py-12">
          <i class="pi pi-inbox text-3xl mb-3"></i>
          <p>Aucun détail trouvé.</p>
        </div>
      </div>

      <!-- Bouton bas -->
      <div class="sticky bottom-0 bg-white py-3 px-6 border-t border-gray-100 shadow-[0_-2px_6px_rgba(0,0,0,0.04)] flex justify-end">
        <Button
          label="Télécharger PDF"
          icon="pi pi-download"
          class="p-button-success shadow-sm"
          @click="downloadPDF"
        />
      </div>
    </Dialog>

    <!-- Dialog de confirmation suppression -->
    <Dialog
      v-model:visible="deleteCashOutDialog"
      :style="{ width: '90%', maxWidth: '450px' }"
      header="Confirmation"
      modal
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-yellow-500" />
        <span>
          Êtes-vous sûr de vouloir supprimer le bon de sortie N°
          {{ selectedCashoutToDelete?.id }} ?
        </span>
      </div>
      <template #footer>
        <Button
          label="Non"
          icon="pi pi-times"
          text
          @click="deleteCashOutDialog = false"
        />
        <Button
          label="Oui"
          icon="pi pi-check"
          text
          severity="danger"
          @click="confirmDeleteCashout"
        />
      </template>
    </Dialog>
  </div>
</template>



<style scoped>
.responsive-dialog {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
</style>
