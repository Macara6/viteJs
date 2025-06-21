


<script setup>
import { fetchCashOut, fetchCashOutDetail, fetchUsers } from '@/service/Api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { onMounted, ref } from 'vue';


   const userId = localStorage.getItem('id');
    const cashoutList = ref([]);
    const usersMap = ref({});
    const selectedCashout = ref(null);
    const cashoutDetails = ref([]);
    const showModal = ref(false);
    const balanceFrozen = ref(false);


    const signatureUrl = '/demo/signature.png';
    

    onMounted(async () => {
        await loadCashOutAndUser();

    });

    async function loadCashOutAndUser(){

        try{

            const [cashouts, users] = await Promise.all([
                fetchCashOut(userId),
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
            
       } catch(error){
         console.error('Erreur lors du chargement des bons de sortie:', error);
       }

    }
 async function ViewDetailCashout(cashoutId){

    try{
         const details = await fetchCashOutDetail(cashoutId);
         selectedCashout.value = cashoutId;
         cashoutDetails.value = details;
         showModal.value = true;
         console.log('Donne details',cashoutDetails);
        

    } catch (error){
        console.log('Erreur lors de la recuperation du details du bon', error);
    }   

 }   

function formatDate(value){
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
function calculateTotal() {
    return cashoutDetails.value.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
}



async function downloadPDF() {
  const element = document.getElementById('cashout-pdf-content');

  console.log('downloadPDF called');
  
  if (!element) {
    console.log('Element not found');
    return;
  }
  if (!element) return;

  // Générer un canvas à partir de l'élément HTML
  const canvas = await html2canvas(element, { scale: 2 });

  // Convertir le canvas en image
  const imgData = canvas.toDataURL('image/png');

  // Créer un PDF au format A4 (210mm x 297mm)
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Calculer largeur/hauteur de l'image dans le PDF pour garder le ratio
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Ajouter l'image dans le PDF
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  // Sauvegarder le PDF avec un nom personnalisé
  pdf.save(`bon_sortie_${selectedCashout.value}.pdf`);
}

</script>


<template>
   <div>
    <div class="card">

        <div class="card">
        <div class="font-semibold text-xl mb-4">Lieste des depasses</div>
        <ToggleButton v-model="balanceFrozen" onIcon="pi pi-lock" offIcon="pi pi-lock-open" onLabel="Balance" offLabel="Balance" />

        <DataTable :value="cashoutList" scrollable scrollHeight="400px" class="mt-6">
          
            <Column field="id" header="Id" style="min-width: 100px"></Column>
            <Column field="total_amount" header="TOTAL" style="min-width: 200px">
                <template #body="slotProps">
                   USD {{ slotProps.data.total_amount }}
                </template>
            </Column>
            <Column field="motif" header="MOTIF" style="min-width: 200px"></Column>
            <Column field="created_at" header="DATE" style="min-width: 200px">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                </template>
            </Column>
            <Column field="user_name" header="DEMANDEUR" style="min-width: 200px"></Column>
            <Column field="" header="ACTION" style="min-width: 200px">
                <template #body="slotProps">
                    <Button 
                        label=""
                        icon="pi pi-eye"
                        class="p-button-sm p-button-info mr-2"
                        @click="ViewDetailCashout(slotProps.data.id)"
                    />
                   
                     <Button icon="pi pi-trash" class="p-button-sm p-button-info mr-2" severity="danger" @click="removeDetail(index)" />
                 
                  
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
            <p class="ext-xl font-semibold mb-1">Date : {{ formatDate(new Date()) }}</p>

            <h2 class="text-xl font-semibold mb-1">Bon de sortie N°/:000{{ selectedCashout }}/25</h2>
            <h3 class="text-lg font-medium mb-2">Motif : 
            <span class="font-normal">
                {{ cashoutList.find(c => c.id === selectedCashout)?.motif || 'N/A' }}
            </span>
            </h3>
        </div>
        <img src="/demo/bila.png" alt="Logo" class="h-40" /> 
        </div>

    <!-- Table des détails -->
            <div v-if="cashoutDetails.length > 0">
            <DataTable :value="cashoutDetails" class="mb-4">
                <Column field="id" header="ID" />
                <Column field="reason" header="Observation" />
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
  </div>
 
</Dialog>


   
</template>