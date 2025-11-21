


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
  selectedUserFilter.value = userId; // par défaut, utilisateur connecté
  await refreshUserData(); // charge profil + cashouts
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
async function loadCashOutAndUser() {
  try {
    const activeUserId = selectedUserFilter.value || userId;

    const [cashouts, users] = await Promise.all([
      fetchCashOut(activeUserId),
      fetchUsers()
    ]);

    usersMap.value = users.reduce((acc, user) => {
      acc[user.id] = user.username;
      return acc;
    }, {});

    cashoutList.value = cashouts.map(cashout => ({
      ...cashout,
      user_name: usersMap.value[cashout.user] || 'Inconnu'
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des bons de sortie:', error);
  }
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

</script>



<template>
  <div>
    <div class="card">
      <div class="font-semibold text-xl mb-4">Liste des Dépasses</div>

      <DataTable
        :value="filterdCashOut"
        scrollable
        scrollHeight="400px"
        class="mt-6"
        :filters="filters"
      >

      <template #header>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">

              <div class="flex gap-3 items-center">
             <RouterLink to="/pages/CreateCashout">
                <Button
                    label="Nouveau Dépasse"
                    icon="pi pi-plus"
                    class="p-button-outlined"
                />
            </RouterLink>

              <Calendar v-model="startDate" placeholder="Date début" date-format="yy-mm-dd" show-icon />
              <Calendar v-model="endDate" placeholder="Date fin" date-format="yy-mm-dd" show-icon />
              <Button label="Réinitialiser" icon="pi pi-refresh" class="p-button-outlined" @click="resetDates" />
            </div>
          <div class="flex flex-wrap gap-3 items-center justify-end w-full sm:w-auto">
            <Dropdown
                  v-model="selectedUserFilter"
                  :options="childUsers"
                  optionLabel="username"
                  optionValue="id"
                  placeholder="Filtrer par utilisateur"
                  class="w-full sm:w-60"
                  @change="loadCashOutAndUser"
                  showClear
                />
              <!-- Recherche globale -->
            <span class="relative flex items-center w-full sm:w-64">
              <i
                v-if="!filters['global'].value"
                class="pi pi-search absolute left-3 text-gray-400 transition-opacity duration-200"
              ></i>

              <InputText
                v-model="filters['global'].value"
                placeholder="     Rechercher..."
                class="w-full pl-9 py-2 text-sm sm:text-base focus:pl-3 transition-all duration-200"
              />
            </span>


            </div>
          </div>
        </template>
        <Column field="id" header="Id" style="min-width: 100px"></Column>

        <Column field="total_amount" header="TOTAL" style="min-width: 200px">
          <template #body="slotProps" v-if="isSuperUser">
            USD {{ slotProps.data.total_amount }}
          </template>
          <template #body="slotProps" v-else>
            {{ userProfile ? userProfile.currency_preference : "Non défini" }}
            {{ slotProps.data.total_amount }}
          </template>
        </Column>

        <Column field="motif" header="DEMANDEUR" style="min-width: 200px"></Column>

        <Column field="created_at" header="DATE" style="min-width: 200px">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>

        <Column field="user_name" header="DONATEUR" style="min-width: 200px"></Column>

        <Column header="ACTION" style="min-width: 150px">
          <template #body="slotProps">
            <Button
              icon="pi pi-eye"
              class="p-button-sm p-button-info mr-2"
              @click="ViewDetailCashout(slotProps.data.id)"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-sm"
              severity="danger"
              @click="deleteToCahOut(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!--  Dialog responsive -->
    <Dialog
      v-model:visible="showModal"
      modal
      header="Détails du bon de sortie"
      :style="{ width: dialogWidth }"
      class="responsive-dialog"
    >
      <div
        class="p-6 overflow-y-auto max-h-[70vh] space-y-6"
        id="cashout-pdf-content"
      >
        <!-- En-tête -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-left flex-1">
            <template v-if="isSuperUser">
              <h2 class="text-lg font-semibold">BILATECH S.A.R.L.U</h2>
              <p class="text-sm md:text-base">
                KINSHASA, NGALIEMA, PIGEON, AV: NIWA, N°25
              </p>
            </template>

            <template v-else>
              <h2 class="text-lg font-semibold">
                {{ userProfile ? userProfile.entrep_name : "Non défini" }}
              </h2>
              <p class="text-sm md:text-base">
                {{ userProfile ? userProfile.adress : "Non défini" }}
              </p>
            </template>

            <p class="text-sm md:text-base">
              Date : {{ formatDate(new Date()) }}
            </p>
            <h3 class="text-base md:text-lg font-medium">
              Bon de sortie N° : 000{{ selectedCashout }}/25
            </h3>
            <h3 class="text-base md:text-lg font-medium">
              Demandeur :
              <span class="font-normal">
                {{
                  cashoutList.find((c) => c.id === selectedCashout)?.motif ||
                  "N/A"
                }}
              </span>
            </h3>
          </div>

          <img src="/demo/bila.png" alt="Logo" class="h-24 md:h-32 lg:h-40" />
        </div>

        <!-- Table des détails -->
        <div v-if="cashoutDetails.length > 0">
          <DataTable :value="cashoutDetails" class="mb-4" responsiveLayout="scroll">
            <Column field="id" header="ID" />
            <Column field="reason" header="Motif" />
            <Column field="amount" header="Montant">
              <template #body="slotProps" v-if="isSuperUser">
                USD {{ slotProps.data.amount }}
              </template>
              <template #body="slotProps" v-else>
                {{
                  userProfile ? userProfile.currency_preference : "Non défini"
                }}
                {{ slotProps.data.amount }}
              </template>
            </Column>
          </DataTable>

          <!-- Total -->
          <div
            class="text-right font-bold text-base md:text-lg mb-4"
            v-if="isSuperUser"
          >
            Total : {{ calculateTotal() }} USD
          </div>
          <div class="text-right font-bold text-base md:text-lg mb-4" v-else>
            Total : {{ calculateTotal() }}
            {{ userProfile ? userProfile.currency_preference : "Non défini" }}
          </div>

          <!-- Signature -->
      
      <div v-if="isSuperUser" class="flex justify-end mt-10">
      <div class="text-center">
        <p class="text-sm">Mr DELOR Musangania</p>
        <p class="text-sm">PDG BILATECH</p>
        <!-- ✅ Signature agrandie -->
        <img 
          :src="signatureUrl" 
          alt="Signature" 
          class="h-36 w-auto mt-2" 
          style="object-fit: contain;"
        />
      </div>

      </div>


        </div>

        <!-- Aucun détail -->
        <div v-else class="text-center text-gray-500">
          Aucun détail trouvé.
        </div>
      </div>

      <!-- Bouton bas -->
      <div
        class="sticky bottom-0 bg-white py-3 px-4 shadow-md flex justify-end"
      >
        <Button
          label="Télécharger PDF"
          icon="pi pi-download"
          class="p-button-success"
          @click="downloadPDF"
        />
      </div>
    </Dialog>

    <!-- ✅ Dialog de confirmation suppression -->
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
