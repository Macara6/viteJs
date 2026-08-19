

<script setup>


import { confirmPayementSubcriptionAPI, deleteInvoiceSubscriptionAPI, fetchSubscriHistoryInovoice } from "@/service/Api";
import { checkInvoice, formatDateTime, invoiceSeverity } from "@/utils/formatters";
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from "vue";
const toast = useToast();

const listHistory = ref([]);

const loadingHistory = ref(false);
const loading = ref(false);
const currentPage = ref(1);
const totalHistory = ref(0)
const totalPages = computed(() =>
    Math.ceil(totalHistory.value / 50)
);
const total_paid_amount = ref(0);
const total_unpaid_amount = ref(0);


const canGoPrevious = computed(() => currentPage.value > 1);
const canGoNext = computed(() => currentPage.value < totalPages.value);
const showConfirmModal = ref(false);
const selectedInvoice = ref(null);
const selectedInvoiceToDelete = ref(null);
const showModalDelate = ref(false);

async function loadSubscriHistoryInvoice(page = 1) {
    if(loadingHistory.value) return;

    try{
        loadingHistory.value = true;
        currentPage.value = page;
        const historyData = await fetchSubscriHistoryInovoice(currentPage.value);
        listHistory.value = historyData.results;
        totalHistory.value = historyData.count;
        total_paid_amount.value = historyData.total_paid_amount;
        total_unpaid_amount.value = historyData.total_unpaid_amount;

    }catch(error){
        console.error("Erreur lors du chargement de l'historique", error)
    }
   
}

function goToPreviousPage(){
    if(canGoPrevious.value){
        loadSubscriHistoryInvoice(currentPage.value - 1);
    }
}

function goToNextPage(){
    if(canGoNext.value){
        loadSubscriHistoryInvoice(currentPage.value + 1);
    }
}

onMounted( async () =>{
    await loadSubscriHistoryInvoice(1);
})

function handleConfirm(invoice){
    selectedInvoice.value = invoice;
    showConfirmModal.value = true;

}
function handleDelete(invoice){
    selectedInvoiceToDelete.value = invoice;
    showModalDelate.value = true
}


async function confirmPayment() {

    try{
        loading.value = true
        const response = await confirmPayementSubcriptionAPI(selectedInvoice.value.id)
        selectedInvoice.value.status = response.status
        selectedInvoice.value.final_payement_date = response.final_payement_date
        showConfirmModal.value = false
        selectedInvoice.value = null;
        await loadSubscriHistoryInvoice(currentPage.value);
        toast.add({ severity: 'success', summary: 'Confirmation', detail: 'Paiement confirmé', life: 3000 });  


    }catch(error){
        console.error('error lors de la confirmation:', error)
    }finally{
        loading.value = false
    }

}

async function confimDelete() {
    try{
        loading.value = true;
        const response = await deleteInvoiceSubscriptionAPI(selectedInvoiceToDelete.value.id);
        listHistory.value = listHistory.value.filter(
            invoice => invoice.id !== selectedInvoiceToDelete.value.id
        );
        totalHistory.value--;
        
        await loadSubscriHistoryInvoice(currentPage.value);
        toast.add({ severity: 'success', summary: 'Suppression', detail: 'facture supprimée', life: 3000 });
        showModalDelate.value = false;
    }catch(error){
        console.error('error to delete invoice :', error)
    }finally{
        loading.value = false
    }
    
}










</script>


<template>
  <div class="p-4 md:p-6">
    <div class="card shadow-sm rounded-xl border border-gray-100 bg-white">

      <!-- En-tête de la page -->
      <div class="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Liste des factures</h1>
          <p class="text-sm text-gray-400 mt-1">Suivi et gestion des facturation clients</p>
        </div>
      </div>

      <DataTable
        :value="listHistory"
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


                <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                  <Calendar
                   
                    placeholder="Date début"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-40"
                  />
                  <i class="pi pi-arrow-right text-gray-400 text-xs"></i>
                  <Calendar
                   
                    placeholder="Date fin"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-40"
                  />
                  <Button
                    icon="pi pi-refresh"
                    class="p-button-text p-button-secondary"
                    v-tooltip.top="'Réinitialiser les dates'"
                    
                  />
                </div>
              </div>

              <!-- Filtre utilisateur + recherche -->
              <div class="flex flex-wrap gap-3 items-center justify-end w-full lg:w-auto">

               

                <!-- Recherche globale -->
                <span class="relative flex items-center w-full sm:w-64">
                  <i
                   
                    class="pi pi-search absolute left-3 text-gray-400 text-sm"
                  ></i>
                  <InputText
                   
                    placeholder="       Rechercher..."
                    class="w-full pl-9 py-2 text-sm rounded-lg"
                  />
                </span>
              </div>
            </div>
                <!-- Ligne 2 : Totaux sous forme de cartes -->
                <div class="flex flex-wrap gap-4">
                  <div class="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 min-w-[180px]">
                    <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <i class="pi pi-money-bill text-orange-600 text-sm"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Total USD EN ATTENTE</div>
                      <div class="text-base font-bold text-yellow-700">{{ total_unpaid_amount }} </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 min-w-[180px]">
                    <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                      <i class="pi pi-dollar text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Total USD PAYÉ</div>
                      <div class="text-base font-bold text-green-700">{{ total_paid_amount }} </div>
                    </div>
                  </div>
                </div>
       

          </div>
        </template>

        <Column field="invoice_number" header="NUMERO" style="min-width: 10px">
          <template #body="slotProps">
            <div>
                {{ slotProps.data.invoice_number }}
            </div>
          </template>
        </Column>

        <Column field="amount" header="MONTANT" style="min-width: 10px">
          <template #body="slotProps">
            <div>
                {{ slotProps.data.amount }} USD
            </div>
          </template>
        </Column>

        <Column field="user_name" header="CLIENT(E)" style="min-width: 80px">
         
        </Column>
        <Column field="subscription_type" header="DESCRIPTION" style="min-width: 80px">
          
        </Column>

        <Column field="created_at" header="DATE" style="min-width: 30px">
          <template #body="slotProps">
            <div>
               {{ formatDateTime(slotProps.data.created_at) }} 
            </div>
          </template>
        </Column>

        <Column
            field="status"
            header="STATUS"
            style="min-width: 120px"
        >
            <template #body="slotProps">

                <Tag
                    :value="checkInvoice(slotProps.data.status)"
                    :severity="invoiceSeverity(slotProps.data.status)"
                    rounded
                />

            </template>
        </Column>

        <Column
            header="PÉRIODE"
            style="min-width: 230px"
            headerStyle="text-align: center"
        >
            <template #body="slotProps">

                <div class="text-center">

                    <div>
                        <span class="text-gray-500">Du</span>
                        <span class="ml-1 font-medium">
                            {{ formatDateTime(slotProps.data.start_date) }}
                        </span>
                    </div>

                    <div>
                        <span class="text-gray-500">Au</span>
                        <span class="ml-1 font-medium">
                            {{ formatDateTime(slotProps.data.end_date) }}
                        </span>
                    </div>

                </div>
            </template>
        </Column>
        <Column field="created_at" header="PAIEMENT FINAL" style="min-width: 30px">
          <template #body="slotProps">
            <div>
               {{ formatDateTime(slotProps.data.final_payement_date) }} 
            </div>
          </template>
        </Column>
    
        <Column field="" header="ACTION" style="min-width: 130px">
          <template #body="slotProps">
            <div class="flex gap-2">
            <Button
                v-if="slotProps.data.status !='paid' "
                icon="pi pi-check-circle"
                class="p-button-sm p-button-rounded p-button-outlined"
                severity="success"
                v-tooltip.top="'marqué comme déjà payé'"
                @click="handleConfirm(slotProps.data)"
              />
            
              <Button
                icon="pi pi-trash"
                class="p-button-sm p-button-rounded p-button-outlined"
                severity="danger"
                v-tooltip.top="'Supprimer'"
               @click="handleDelete(slotProps.data)"
              />

            </div>
          </template>
        </Column>
      </DataTable>
         <div class="flex items-center justify-between gap-3 py-3">
          <Button
            label="Précédent"
            icon="pi pi-chevron-left"
            :disabled="!canGoPrevious || loadingHistory"
            @click="goToPreviousPage"
           
          />

          <span class="text-sm text-gray-500">
            Page {{ currentPage }} / {{ totalPages || 1 }}
            - {{ totalHistory }} factures
          </span>

          <Button
            label="Suivant"
            icon="pi pi-chevron-right"
            iconPos="right"
            :disabled="!canGoNext || loadingHistory"
            @click="goToNextPage"
          />
        </div>

    </div>



        <Dialog
            v-model:visible="showConfirmModal"
            :style="{ width: '90%', maxWidth: '450px' }"
            header="Confirmation"
            modal
            >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-yellow-500" />
        <span>
          Êtes-vous sûr de confimer le paiement de cette facture  N°
          {{ selectedInvoice?.invoice_number }} ?
        </span>
      </div>
      <template #footer>
        <Button
          label="Non"
          icon="pi pi-times"
          severity="danger"
          text
          @click="showConfirmModal = false"
        />

        <Button
          label="Oui"
          icon="pi pi-check"
          text
          severity="success"
           :loading="loading"
           :disabled="loading"
          @click="confirmPayment"
        />

      </template>
    </Dialog>




    <Dialog
      v-model:visible="showModalDelate"
      :style="{ width: '90%', maxWidth: '450px' }"
      header="Confirmation"
      modal
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-yellow-500" />
        <span>
          Êtes-vous sûr de vouloir supprimer cette facture N°
          {{ selectedInvoiceToDelete?.invoice_number }} ?
        </span>
      </div>
      <template #footer>
        <Button
          label="Non"
          icon="pi pi-times"
          text
          @click="showModalDelate = false"
        />
        <Button
          label="Oui"
          icon="pi pi-check"
          text
          severity="danger"
          :loading="loading"
          :disabled="loading"
          @click="confimDelete"
        />
      </template>
    </Dialog>
    

  </div>

</template>


<style scoped>



</style>