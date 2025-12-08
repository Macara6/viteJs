

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

function resetDates(){
  startDate.value =null;
  endDate.value = null;
}
   watch(selectedUserFilter, async () =>{
    await refreshUserData();
   })
   async function refreshUserData(){
    await Promise.all([fetchUserProfil(),loadEntryNoteAndUser()]);
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
   async function loadEntryNoteAndUser(){
    const activeUserId = selectedUserFilter.value || userId;
     try{
        const [EntryNotes, users] =await Promise.all([
            fechEntryNote(activeUserId),
            fetchUsers()
        ]);

        usersMap.value = users.reduce((acc, user) => {
            acc[user.id] = user.username;
            return acc;
        }, {});

        EntryNoteList.value = EntryNotes.map(EntryNote => ({
            ...EntryNote,
            user_name: usersMap.value[EntryNote.user] || 'Inconnu'
        }));
     } catch(error){
        console.error('Erreur lors du chargment des bons');
     }
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
    <div>
    <div class="card">
        <div class="card">
            <div class="font-semibold text-xl mb-4">Lieste des entrées </div>
          
              <DataTable 
              :value="filterdEntryNote" 
              scrollable 
              scrollHeight="400px"
              :filters="filters"
               class="mt-6">

            <template #header>
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4">

                   <div class="flex gap-3 items-center">
                      <RouterLink to="/pages/CreateEntryNote">
                            <Button
                                label="Nouvelle entrée"
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
              :options="childUsers.map(u => ({
                id: u.id,
                username: u.username,
                status: u.status
              })).filter(u => u.status !=='GESTIONNAIRE_STOCK')"
              optionLabel="username"
              placeholder="Filtrer par utilisateur"
              class="w-full sm:w-60"
              @change="loadEntryNoteAndUser"
              showClear
            >
              <!-- Affichage des options dans la liste -->
              <template #item="slotProps">
                <div class="flex items-center justify-between w-full">
                  <span>{{ slotProps.item.username }}</span>
                  <span
                    class="px-2 py-1 rounded text-xs"
                    :class="{
                      'bg-green-100 text-green-700': slotProps.item.status === 'ADMIN',
                      'bg-blue-100 text-blue-700': slotProps.item.status === 'CAISSIER',
                      'bg-gray-200 text-gray-700': slotProps.item.status === 'GESTIONNAIRE_STOCK'
                    }"
                  >
                    {{ slotProps.item.status }}
                  </span>
                </div>
              </template>

              <!-- Affichage de la valeur sélectionnée -->
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <span>{{ slotProps.value.username }}</span>
                  <span
                    class="px-2 py-1 rounded text-xs"
                    :class="{
                      'bg-green-100 text-green-700': slotProps.value.status === 'ADMIN',
                      'bg-blue-100 text-blue-700': slotProps.value.status === 'CAISSIER',
                      'bg-gray-200 text-gray-700': slotProps.value.status === 'GESTIONNAIRE_STOCK'
                    }"
                  >
                    {{ slotProps.value.status }}
                  </span>
                </div>
                <span v-else>Filtrer par utilisateur</span>
              </template>
            </Dropdown>

                    <!-- Recherche globale -->
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
                <Column field="supplier_name" header="CLIENT(E)" style="min-width: 200px"></Column>
                <Column field="created_at" header="DATE" style="min-width: 200px">
                    <template #body="slotProps">
                       {{ formatDate(slotProps.data.created_at) }}
                    </template>
                </Column>
                <Column field="user_name" header="DONATEUR" style="min-width: 200px"></Column>
                <Column field="" header="ACTION" style="min-width: 200px">
                    <template #body="slotProps">
                        <Button 
                            label=""
                            icon="pi pi-eye"
                            class="p-button-sm p-button-info mr-2"
                            @click="ViewDetailEntryNote(slotProps.data.id)"
                        />
                    
                        <Button icon="pi pi-trash" class="p-button-sm p-button-info mr-2" severity="danger" @click="deleteToEntryNote(slotProps.data)" />
                    

                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</div>

<Dialog
 v-model:visible="showModal"
  modal header="Détails du bon de sortie" 
  :style="{ width: '50vw' }">

      <div id="cashout-pdf-content" style="overflow: visible; max-height: none;">
      
    <!-- En-tête -->
    <div class="flex justify-between items-center mb-6">
       
        <div class="text-left flex-2"> 
          <template v-if="isSuperUser">
            <h2 class="text-lg font-medium mb-2">BILATECH S.A.R.L.U</h2>
            <p class="ext-xl font-semibold mb-2">KINSHASA, NGALIEMA, PIGEON, AV: NIWA, N°25</p>
            <p class="ext-xl font-semibold mb-1"> Kinshasa, le {{formate(new Date()) }}</p>

            <h2 class="text-xl font-semibold mb-1">Reçu  N°/:000  /25</h2>
            <h3 class="text-lg font-medium mb-2">Client(e) : 
            <span class="text_xl font-semibold mb-1">
                {{ EntryNoteList.find(c => c.id === seletedEntryNote)?.supplier_name ||'N/A' }}
            </span>
            </h3>
        </template>
        <template v-else>
          <h2 class="text-lg font-medium mb-2">{{ userProfile ? userProfile.entrep_name : 'N/A' }}</h2>
           <p class="ext-xl font-semibold mb-2">{{ userProfile ? userProfile.adress :'N/A' }}</p>
           <p class="ext-xl font-semibold mb-1"> le {{formatDate(new Date()) }}</p>
           <h2 class="text-xl font-semibold mb-1">Reçu  N°/:000  {{ seletedEntryNote }}</h2>
           <h3 class="text-lg font-medium mb-2">Client(e) : 
            <span class="text_xl font-semibold mb-1">
                {{ EntryNoteList.find(c => c.id === seletedEntryNote)?.supplier_name ||'N/A' }}
            </span>
          </h3>
        </template>
        </div>
        <img src="/demo/bila.png" alt="Logo" class="h-40" /> 
        </div>

    <!-- Table des détails -->
            <div v-if="entryNoteDetails.length > 0">
            <DataTable :value="entryNoteDetails" class="mb-4">
                <Column field="id" header="ID" />
                <Column field="reason" header="Motif" />
                <Column field="amount" header="Montant">
                <template #body="slotProps" v-if="isSuperUser">
                    USD {{ slotProps.data.amount }}
                </template>
                <template #body="slotProps" v-else>
                  {{ userProfile ? userProfile.currency_preference :'N/A'}}
                  {{ slotProps.data.amount }}
                </template>

                </Column>
            </DataTable>

      <!-- Total -->
        <div v-if="isSuperUser" class="text-right font-bold text-lg mb-6">
            Total : {{ calculateTotal() }} USD
        </div>
        <div v-else class="text-right font-bold text-lg mb-6">
            Total : {{ calculateTotal() }} {{ userProfile ? userProfile.currency_preference  :'N/A'}}
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

          
    <!-- Message si aucun détail -->
     <div v-else class="text-center text-gray-500">
      Aucun détail trouvé.
     </div>
  </div>

  <div 
    
  >
    <Button 
      label="Télécharger PDF"
      icon="pi pi-download"
      class="p-button-success"
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