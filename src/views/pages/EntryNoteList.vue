

<script setup>
import { fechEntryNote,fetchEntryNoteDetail ,fetchUsers } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
   

   const userId = localStorage.getItem('id');
   const EntryNoteList = ref([]);
   const usersMap = ref({});
   const seletedEntryNote = ref(null);
   const entryNoteDetails = ref([]);
   const showModal = ref(false);
   
   const deleteEntryNoteDialog = ref(false);
   const selectedEntryNoteToDelete = ref(null);
   const toast = useToast();

   const signatureUrl = '/demo/signature.png'

   onMounted(async () => {
    await loadEntryNoteAndUser();

   })
   
   async function loadEntryNoteAndUser(){

     try{
        const [EntryNotes, users] =await Promise.all([
            fechEntryNote(userId),
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

  function formate(value){
    const options = {
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        hour12:false,
    };
    const date = new Date(value);
    return date.toLocaleDateString('sv-SE', options).replace(' ',' |  ');
  }
  function calculateTotal(){
    return entryNoteDetails.value.reduce((sum, item) => sum + parseFloat(item.amount),0).toFixed(2);
  }
  


   
 
</script>


<template>
    <div>
    <div class="card">
        <div class="card">
            <div class="font-semibold text-xl mb-4">Lieste des entrées </div>
            <ToggleButton v-model="balanceFrozen" onIcon="pi pi-lock" offIcon="pi pi-lock-open" onLabel="Balance" offLabel="Balance" />

            <DataTable :value="EntryNoteList" scrollable scrollHeight="400px" class="mt-6">
            
                <Column field="id" header="Id" style="min-width: 100px"></Column>
                <Column field="total_amount" header="TOTAL" style="min-width: 200px">
                    <template #body="slotProps">
                        USD {{ slotProps.data.total_amount }} 
                    </template>
                </Column>
                <Column field="supplier_name" header="CLIENT(E)" style="min-width: 200px"></Column>
                <Column field="created_at" header="DATE" style="min-width: 200px">
                    <template #body="slotProps">
                       {{ formate(slotProps.data.created_at) }}
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
                    
                        <Button icon="pi pi-trash" class="p-button-sm p-button-info mr-2" severity="danger" @click="" />
                    
                    
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</div>

<Dialog v-model:visible="showModal" modal header="Détails du bon de sortie" :style="{ width: '50vw' }">
      <div class="p-9" id="cashout-pdf-content" style="overflow-y: auto; max-height: 70vh;">
      
    <!-- En-tête -->
    <div class="flex justify-between items-center mb-6">
       
        <div class="text-left flex-2"> 
            <h2 class="text-lg font-medium mb-2">BILATECH S.A.R.L.U</h2>
            <p class="ext-xl font-semibold mb-2">KINSHASA, NGALIEMA, PIGEON, AV: NIWA, N°25</p>
            <p class="ext-xl font-semibold mb-1"> Kinshasa, le {{formate(new Date()) }}</p>

            <h2 class="text-xl font-semibold mb-1">Reçu  N°/:000  /25</h2>
            <h3 class="text-lg font-medium mb-2">Client(e) : 
            <span class="text_xl font-semibold mb-1">
                {{ EntryNoteList.find(c => c.id === seletedEntryNote)?.supplier_name ||'N/A' }}
            </span>
            </h3>
        </div>
        <img src="/demo/bila.png" alt="Logo" class="h-40" /> 
        </div>

    <!-- Table des détails -->
            <div v-if="entryNoteDetails.length > 0">
            <DataTable :value="entryNoteDetails" class="mb-4">
                <Column field="id" header="ID" />
                <Column field="reason" header="Motif" />
                <Column field="amount" header="Montant">
                <template #body="slotProps">
                    USD {{ slotProps.data.amount }}
                </template>
                </Column>
            </DataTable>

      <!-- Total -->
        <div class="text-right font-bold text-lg mb-6">
            Total : {{ calculateTotal() }} USD
        </div>

      <!-- Signature -->
      
      <div class="flex justify-end mt-10">
        <div class="text-center">
          <p class="text-sm">Mr DELOR Musangania</p>
          <p class="text-sm">PDG BILATECH</p>
          <img :src="signatureUrl" alt="Signature" class="h-24 mt-2" />
        </div>
      </div>
    </div>

          
    <!-- Message si aucun détail -->
     <div v-else class="text-center text-gray-500">
      Aucun détail trouvé.
     </div>
  </div>

  <div 
    style="position: sticky; bottom: 0; background: white; padding: 1rem; box-shadow: 0 -2px 5px rgba(0,0,0,0.1); z-index: 10;"
  >
    <Button 
      label="Télécharger PDF"
      icon="pi pi-download"
      class="p-button-success"
      @click=""
    />
  </div>
 
</Dialog>
</template>