

<script setup>
import { deleteEntryNote, fechEntryNote, fetchEntryNoteDetail, fetchUsers } from '@/service/Api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  
  async function downloadPDF() {
  const element = document.querySelector('.p-dialog'); // Cible la boîte de dialogue entière

  if (!element) {
    console.error('Élément du bon de sortie introuvable.');
    return;
  }

  // Scroll au top si nécessaire
  element.scrollTop = 0;

  // Attendre que le contenu soit bien visible
  await new Promise(resolve => setTimeout(resolve, 300));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  const totalPages = Math.ceil(pdfHeight / pdf.internal.pageSize.getHeight());

  let position = 0;
  for (let i = 0; i < totalPages; i++) {
    if (i !== 0) pdf.addPage();
    pdf.addImage(
      imgData,
      'PNG',
      0,
      -position,
      pdfWidth,
      pdfHeight
    );
    position += pdf.internal.pageSize.getHeight();
  }

  pdf.save(`bon_sortie_${seletedEntryNote.value}.pdf`);
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


function printEntryNote() {
  const content = document.getElementById('cashout-pdf-content');

  if (!content) {
    console.error("Contenu à imprimer non trouvé !");
    return;
  }

  const printWindow = window.open('', '', 'width=800,height=600');

  printWindow.document.write(`
    <html>
      <head>
        <title>Impression Bon d'Entrée</title>

        <!-- Inclusion de TailwindCSS si nécessaire -->
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

        <!-- PrimeVue CSS (si nécessaire pour DataTable) -->
        <link href="https://unpkg.com/primevue/resources/themes/saga-blue/theme.css" rel="stylesheet">
        <link href="https://unpkg.com/primevue/resources/primevue.min.css" rel="stylesheet">
        <link href="https://unpkg.com/primeicons/primeicons.css" rel="stylesheet">

        <style>
            @page {
            margin: 0;
          }
          body {
            padding: 2rem;
            font-family: Arial, sans-serif;
            color: #000;
          }

          /* Fixe pour les DataTables */
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 1.5rem;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 0.5rem;
            text-align: left;
          }

          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }

          img {
            max-height: 100px;
          }

          .signature img {
            height: 80px;
            margin-top: 10px;
          }

          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Important : attendre que le contenu soit chargé avant impression
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
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
                    
                        <Button icon="pi pi-trash" class="p-button-sm p-button-info mr-2" severity="danger" @click="deleteToEntryNote(slotProps.data)" />
                    

                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</div>

<Dialog v-model:visible="showModal" modal header="Détails du bon de sortie" :style="{ width: '50vw' }">
      <div id="cashout-pdf-content" style="overflow: visible; max-height: none;">
      
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
      @click="downloadPDF"
    />

    <Button 
  label="Imprimer"
  icon="pi pi-print"
  class="p-button-secondary ml-2"
  @click="printEntryNote"
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