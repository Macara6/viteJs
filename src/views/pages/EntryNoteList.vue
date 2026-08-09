

<script setup>
import { deleteEntryNote, fechEntryNote, fetchEntryNoteDetail, fetchUserProfilById, fetchUsers, getUsersCreatedByMe } from '@/service/Api';
import { formatDate } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

  const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

   const userId = localStorage.getItem('id');
   const EntryNoteList = ref([]);
   const usersMap = ref({});
   const seletedEntryNote = ref(null);
   const entryNoteDetails = ref([]);
   const showModal = ref(false);
  
   
   const deleteEntryNoteDialog = ref(false);
   const selectedEntryNoteToDelete = ref(null);
   const toast = useToast();
   
   const userProfile = ref(null);
   const selectedUserFilter = ref(null);
   const childUsers = ref([]);
   const isSuperUser = localStorage.getItem('is_superuser') === 'true';
  
  const startDate = ref(null);
  const endDate= ref(null);
  
   const signatureUrl = '/demo/SignatureDe.png'


   onMounted(async () => {
    await getUserChildren();
    selectedUserFilter.value = userId
    await refreshUserData();

   })

   const filterdEntryNote = computed(() => {
    return EntryNoteList.value.filter(item => {
      const created = new Date(item.created_at);
      const start = startDate.value? new Date(startDate.value): null;
      const end = endDate.value? new Date(endDate.value):null;
      if(start && end ) return created >= start && created <= end;
      if(start) return created >= start;
      if(end) return created >= end;
      return true;
     })
   })

const totalAmountCDF = ref(0)

const totalAmountUSD = ref(0);


function resetDates(){
  startDate.value =null;
  endDate.value = null;
}
   watch(selectedUserFilter, async () =>{
    await refreshUserData();
   })
   async function refreshUserData(){
    await Promise.all([fetchUserProfil(),loadEntryNoteAndUser(1)]);
   }

   // Récuper les enfants
   async function getUserChildren(){
    try{
      const allCreatedUsers = await getUsersCreatedByMe();
      childUsers.value = allCreatedUsers;
    }catch(error){
      console.error('Erreur getUserChuldren:', error);
     }
   }

   // charger les bons d'entré
   const loadingEntryNote = ref(false);
   const currentPage = ref(1);
   const totalEntry = ref(0);

  const totalPages = computed(() =>
  Math.ceil(totalEntry.value / 50)
);

const canGoPrevious = computed(() => currentPage.value > 1);

const canGoNext = computed(() => currentPage.value < totalPages.value);


  async function loadEntryNoteAndUser(page = 1) {
  if (loadingEntryNote.value) return;

  try {
    loadingEntryNote.value = true;

    const activeUserId = selectedUserFilter.value || userId;
    currentPage.value = page;

    const [entryNoteData, users] = await Promise.all([
      fechEntryNote(activeUserId, currentPage.value),
      fetchUsers()
    ]);

    usersMap.value = users.reduce((acc, user) => {
      acc[user.id] = user.username;
      return acc;
    }, {});

    EntryNoteList.value = entryNoteData.results.map(entryNote => ({
      ...entryNote,
      user_name: usersMap.value[entryNote.user] || 'Inconnu'
    }));

    totalEntry.value = entryNoteData.count;
    totalAmountUSD.value = entryNoteData.total_usd;
    totalAmountCDF.value = entryNoteData.total_cdf;

  } catch (error) {
    console.error('Erreur lors du chargement des bons:', error);
  } finally {
    loadingEntryNote.value = false;
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
function resetEntryPagination() {
  loadEntryNoteAndUser(1)
}








   // charger le profil utilisateur actif
   async function fetchUserProfil(){
     const activeUserId = selectedUserFilter.value || userId;
     try{
        const result = await fetchUserProfilById(activeUserId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
     }catch(error){
        console.error('Erreur lors de la réperation du profil utilisateur');
     }
   }



   async function ViewDetailEntryNote(entryNoteId){

     try{
        const details = await fetchEntryNoteDetail(entryNoteId);
        seletedEntryNote.value = entryNoteId;
        entryNoteDetails.value = details;
        showModal.value = true;
        console.log('Donne details',entryNoteDetails);

     }catch(error){
        console.log('Erreur lors de la recuperation du details', error);
      }
   }


  function calculateTotal(){
    return entryNoteDetails.value.reduce((sum, item) => sum + parseFloat(item.amount),0).toFixed(2);
  }


async function downloadPDF() {
  const element = document.getElementById('cashout-pdf-content');

  if (!element) {
    console.error('Élément du bon de sortie introuvable.');
    return;
  }

  // Attendre que tout soit bien rendu
  element.scrollTop = 0;
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Capture du contenu
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Dimensions PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Dimensions de l'image avec marge horizontale
    const imgWidth = pdfWidth - 20; // 10 mm à gauche et à droite
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    //  Marge haute réduite
    let yOffset = 5; // marge haute = 5 mm

    // Centrage vertical si le contenu est plus petit que la page
    const centeredY = (pdfHeight - imgHeight) / 2;
    if (centeredY > yOffset) yOffset = centeredY;

    // Ajout de l’image avec marge et centrage
    pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);

    // Gestion du contenu sur plusieurs pages si nécessaire
    let heightLeft = imgHeight - (pdfHeight - 20);
    let position = yOffset - pdfHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
      position -= pdfHeight - 20;
    }

    // Nom du fichier dynamique
    const fileName = `bon_sortie_${seletedEntryNote.value || 'export'}.pdf`;
    pdf.save(fileName);

    console.log(`✅ PDF téléchargé : ${fileName}`);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF :', error);
  }
}




 async function confirmDeleteEntryNote(){
    try{
        if(!selectedEntryNoteToDelete.value) return;
        
        await deleteEntryNote(selectedEntryNoteToDelete.value.id);
        EntryNoteList.value = EntryNoteList.value.filter(
            c => c.id !== selectedEntryNoteToDelete.value.id
        );
        deleteEntryNoteDialog.value = false;
        selectedEntryNoteToDelete.value = null;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Bon supprimer', life: 3000 });
    } catch(error){
        console.error('Erreur lors de la suppression du bon de sortie:', error);
    }
 }

 function deleteToEntryNote(entryNoteId){
    selectedEntryNoteToDelete.value = entryNoteId;
    deleteEntryNoteDialog.value = true;
 }
    
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="card shadow-sm rounded-xl border border-gray-100 bg-white">

      <!-- En-tête de la page -->
      <div class="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Liste des Entrées</h1>
          <p class="text-sm text-gray-400 mt-1">Suivi et gestion des notes d'entrée de caisse</p>
        </div>
      </div>

      <DataTable
        :value="filterdEntryNote"
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
                <RouterLink to="/pages/CreateEntryNote">
                  <Button
                    label="Nouvelle entrée"
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

                  <template #seletecdItem="slotProps">
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

                <!-- Recherche globale -->
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
          <template #body="slotProps" v-if="isSuperUser">
            <span class="font-semibold text-gray-800"> {{ slotProps.data.total_amount }} {{ slotProps.data.currency }}  </span>
          </template>

          <template #body="slotProps" v-else>
            <span class="font-semibold text-gray-800">
              {{ slotProps.data.total_amount }}
              {{ slotProps.data.currency || (userProfile ? userProfile.currency_preference : "N/A") }}
              
            </span>
          </template>
        </Column>

        <Column field="supplier_name" header="CLIENT(E)" style="min-width: 200px">
          <template #body="slotProps">
            <span class="text-gray-700">{{ slotProps.data.supplier_name }}</span>
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

        <Column field="user_name" header="RECEVEUR" style="min-width: 200px">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
                {{ slotProps.data.user_name?.charAt(0)?.toUpperCase() }}
              </div>
              <span class="text-gray-700 text-sm">{{ slotProps.data.user_name }}</span>
            </div>
          </template>
        </Column>

        <Column field="" header="ACTION" style="min-width: 130px">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                label=""
                icon="pi pi-eye"
                class="p-button-sm p-button-rounded p-button-outlined p-button-info"
                v-tooltip.top="'Voir le détail'"
                @click="ViewDetailEntryNote(slotProps.data.id)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-sm p-button-rounded p-button-outlined"
                severity="danger"
                v-tooltip.top="'Supprimer'"
                @click="deleteToEntryNote(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
         <div class="flex items-center justify-between gap-3 py-3">
          <Button
            label="Précédent"
            icon="pi pi-chevron-left"
            :disabled="!canGoPrevious || loadingEntryNote"
            @click="goToPreviousPage"
          />

          <span class="text-sm text-gray-500">
            Page {{ currentPage }} / {{ totalPages || 1 }}
            - {{ totalEntry }} bons d'entrée
          </span>

          <Button
            label="Suivant"
            icon="pi pi-chevron-right"
            iconPos="right"
            :disabled="!canGoNext || loadingEntryNote"
            @click="goToNextPage"
          />
        </div>


    </div>
  </div>

  <Dialog
    v-model:visible="showModal"
    modal
    header="Détails du bon d'entrée"
    :style="{ width: '50vw' }"
  >
    <div
      id="cashout-pdf-content"
      class="p-6 md:p-8 bg-white space-y-6"
      style="overflow: visible; max-height: none;"
    >

      <!-- En-tête -->
      <div class="flex justify-between items-start gap-6 pb-6 border-b border-gray-200 mb-6">

        <div class="text-left flex-2 space-y-1">
          <template v-if="isSuperUser">
            <h2 class="text-xl font-bold text-gray-800 tracking-wide mb-1">BILATECH S.A.R.L.U</h2>
            <p class="text-sm md:text-base text-gray-500">
              KINSHASA, NGALIEMA, PIGEON, AV: NIWA, N°25
            </p>
            <p class="text-sm md:text-base text-gray-500">

              Kinshasa, le {{ formatDate(new Date()) }}
            </p>

            <h2 class="text-lg font-semibold text-gray-800 pt-2">Reçu N°/: 000 /25</h2>
            <h3 class="text-base md:text-lg font-medium text-gray-700">
              Client(e) :
              <span class="font-normal text-gray-600">
                {{ EntryNoteList.find(c => c.id === seletedEntryNote)?.supplier_name || 'N/A' }}
              </span>
            </h3>
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
              <p><span class="text-gray-400">Devise :</span>  {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.currency || "N/A" }}</p>
            </div>
          </template>

          <p class="text-sm md:text-base text-gray-500 pt-2">
            Date : {{ formatDate(new Date()) }}
          </p>

          <div class="pt-3 space-y-1">
            <h3 class="text-base md:text-lg font-semibold text-gray-800">
              Bon d'entrée N°
              <span class="text-primary-600">000{{ seletedEntryNote }}</span>
            </h3>
            <h3 class="text-base md:text-lg font-medium text-gray-700">
              Client(e) :
              <span class="font-normal text-gray-600">
                {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.supplier_name || "N/A" }}
              </span>
            </h3>
          </div>
        </div>

        <img
          v-if="isSuperUser"
          src="/demo/bila.png"
          alt="Logo"
          class="h-40 object-contain"
        />
      </div>

      <!-- Table des détails -->
      <div v-if="entryNoteDetails.length > 0">
        <div class="rounded-lg border border-gray-200 overflow-hidden mb-6">
          <DataTable :value="entryNoteDetails" stripedRows class="text-sm">
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
                <span class="font-semibold text-gray-800">
                {{ slotProps.data.amount }}  {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.currency || "N/A" }} 
                
                </span>
              </template>
              <template #body="slotProps" v-else>
                <span class="font-semibold text-gray-800">
                  
                  {{ slotProps.data.amount }}
                   {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.currency || "N/A" }}
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
                {{ calculateTotal() }}  {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.currency || "N/A" }}
              </span>
            </div>
            <div v-else class="flex justify-between items-center gap-6">
              <span class="text-sm text-gray-500 font-medium">Total</span>
              <span class="text-base md:text-lg font-bold text-gray-800">
                {{ calculateTotal() }}  {{ EntryNoteList.find((c) => c.id === seletedEntryNote)?.currency || "N/A" }}
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

      <!-- Message si aucun détail -->
      <div v-else class="flex flex-col items-center justify-center text-center text-gray-400 py-12">
        <i class="pi pi-inbox text-3xl mb-3"></i>
        <p>Aucun détail trouvé.</p>
      </div>
    </div>

    <div class="sticky bottom-0 bg-white py-3 px-6 border-t border-gray-100 shadow-[0_-2px_6px_rgba(0,0,0,0.04)] flex justify-end">
      <Button
        label="Télécharger PDF"
        icon="pi pi-download"
        class="p-button-success shadow-sm"
        @click="downloadPDF"
      />
    </div>
  </Dialog>

<Dialog v-model:visible="deleteEntryNoteDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>
                Êtes-vous sûr de vouloir supprimer le bon de sortie N° {{ selectedEntryNoteToDelete?.id }} ?
                </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteEntryNoteDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="confirmDeleteEntryNote" />
            </template>
     </Dialog>

</template>