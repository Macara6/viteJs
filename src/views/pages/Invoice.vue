<script setup>

import {
    deleteInvoiceAPI,
    fetchInvoiceDetail,
    fetchInvoicesAllChildrent, fetchInvoicesAllUsers, fetchUserProfilById,
    fetchUsers
} from '@/service/Api';
import { FilterMatchMode } from '@primevue/core';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';


const toast = useToast();
const invoices = ref([]);
const invoice = ref({});
const users =  ref({});
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS}
});
const deleteInvoiceDialog = ref(false);
const deleteInvoicesDialog = ref(false);
const invoiceDetails = ref(null);
const selectedInvoices = ref();
const userProfile = ref(null);
const showModal = ref(false);

const showOnlyChildren = ref(false);


onMounted (async () =>{
   await loadInvoiceAndAdmin();
   await fetchUserProfil();
});

function sortInvoicesByDate(){

    invoices.value.sort((a,b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    }); 
}

async function fetchUserProfil(){
    const userId = localStorage.getItem('id');
    try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        console.log('Profil utilisateur récupéré :', result);
    } catch(error){
        console.error('Erreur lors de la récuperation du profi utilisateur', error);
    }
}
async function ViewDetailInvoice(invoiceId){
    try{
        const details = await fetchInvoiceDetail(invoiceId);
        selectedInvoices.value = invoiceId,
        invoiceDetails.value = details;
        showModal.value = true;
        console.log('Donne details invoice', invoiceDetails);
    }catch(error){
        console.error('error to fetching detail invoice', error);
        throw error;
    }
}



async function loadInvoiceAndAdmin(){
    try {
        const [fetchedUsers, invoicesData] = await Promise.all([
            fetchUsers(),
            showOnlyChildren.value ? fetchInvoicesAllChildrent(true) : fetchInvoicesAllUsers()
        ]);
        users.value = fetchedUsers.reduce((acc, user) => {
            acc[user.id] = user.username;
            return acc;
        }, {});

        invoices.value = invoicesData.map(invoice => {
            const cashier_name = users.value[invoice.cashier] || 'Unknown';
            return {
                ...invoice,
                cashier_name
            };
        });
        
        sortInvoicesByDate();
    } catch (error) {
        console.error('Erreur de chargement des données:', error);
    }
}


function refreshPage(){
    invoices.value = [];
    users.value = [];
    loadInvoiceAndAdmin();
}


function formatDate(value){

    const options ={
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour: '2-digit',
        minute:'2-digit',
        hour12: false,
    };
    const date = new Date(value);
    return date.toLocaleString('sv-SE', options).replace(' ',' ');
}

function confirmDeleteInvoice(invoic){
    invoice.value = invoic;
    deleteInvoicesDialog.value = true;

}
function confirmDeleteSelected(){
    deleteInvoicesDialog.value = true;
}

 function deleteSelectedInvoices(){
    invoices.value = invoices.value.filter((val) => !selectedInvoices.value.includes(val));
   
    deleteInvoicesDialog.value = false;
    selectedInvoices.value = null;
}
async function deleteInvoice(){
    try{
        await  deleteInvoiceAPI(invoice.value.id);
        invoices.value = invoices.value.filter((val) => val.id !==invoice.value.id);
        deleteInvoicesDialog.value = false;
        selectedInvoices.value = null;
        toast.add({ severity: 'success', summary:'Successful',detail:'Invoice delect', life:3000});
    } catch(error){
        console.error('Error deletin invoice', error);
         toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete invoice', life: 3000 });
    }
}


function remiseTaux(totalPayer,value){
   const remise = (value*100)/totalPayer;

    return parseFloat(remise.toFixed(2));
}

function formaPrice(price){
    if(price !== null && price !== undefined) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}

</script>


<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Effacer" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedInvoices || !selectedInvoices.length" />
                </template> 
                <template #end>
                    <Checkbox
                    v-model="showOnlyChildren"
                        :binary="true"
                        inputId="onlyChildren"
                        @change="refreshPage"
                    />          
                        <label for="onlyChildren" class="ml-2">Enfants uniquement</label>
                    <Button label="Actualiser" icon ="pi pi-refresh" severity="primary" class="m-2" @click="refreshPage"/>  
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="invoices"
                v-model:selection="selectedInvoices"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Factures "
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Table Factures</h4>
                       <IconField>
                            <InputIcon>
                                <i class="pi pi-search"/>
                            </InputIcon>
                            <InputText v-model="filters['global'].value" type="date"  />
                        </IconField>
                    </div>
                </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="id" header="ID" sortable style="min-width:3rem"></Column>
                <Column field="client_name" header="Nom Client(e)" sortable style="min-width:8rem"></Column>
                <Column field="cashier_name" header="Cassier(e)" sortable style="min-width: 8rem">
             
                </Column>
                <Column field="total_amount" header="Total" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                            {{formaPrice(slotProps.data.total_amount) }}
                    </template>
                </Column>
                <Column field="profit_amount" header="Bénefince" sortable style="min-width: 8rem;">
                    <template #body="slotProps">
                        {{ formaPrice(slotProps.data.profit_amount)}}
                    </template>
                </Column>
                <Column field="change" header="Reste" sortable style="min-width: 8rem">
                        <template #body = "slotProps">
                            {{ formaPrice(slotProps.data.change) }} 
                        </template>
                </Column>
                <Column field="amount_paid" header="Montant Perçu" sortable style="min-width: 8rem">
                        <template #body = "slotProps">
                            {{ formaPrice(slotProps.data.amount_paid) }} 
                        </template>
                </Column>
                <Column field="" header="Devise" sortable style="min-width:2rem" >
                    <template #body="">
                        {{ userProfile ? userProfile.currency_preference :'No définie'}}
                    </template>
                </Column>
                <Column field="created_at" header="Date" sortable style="min-width: 8rem">
                  <template #body = "slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                  </template>
                </Column>
                <Column field="inventoryStatus" header="Action" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" outlined rounded class="mr-2" @click="ViewDetailInvoice(slotProps.data.id)" />
                        <Button icon="pi pi-trash"  outlined rounded severity="danger" @click="confirmDeleteInvoice(slotProps.data)" />
                    </template> 
                </Column>

            </DataTable>
        </div>
        <Dialog  v-model:visible="deleteInvoicesDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="invoice">Are you sure you want to delete the selected invoice?</span>
            </div>  
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteInvoice" />
            </template>
        </Dialog>





<Dialog v-model:visible="showModal" modal header="🧾 Détails de la facture" :style="{ width: '55vw' }">
  <div class="p-6 bg-gray-50 rounded-md shadow-sm" id="cashout-pdf-content" style="overflow-y: auto; max-height: 70vh;">
    
    <!-- En-tête de facture -->
    <div class="flex justify-between items-start border-b pb-4 mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          {{ userProfile ? userProfile.entrep_name : 'Entreprise non définie' }}
        </h2>
        <p class="text-gray-600">
          {{ userProfile ? userProfile.adress : 'Adresse non définie' }}
        </p>
        <p class="mt-2 text-sm">
          <strong>Client :</strong> {{ invoices.find(c=> c.id === selectedInvoices)?.client_name|| 'Non défini' }}
        </p>
        <p class="text-sm">
          <strong>Caissier :</strong> {{ invoices.find(c=> c.id === selectedInvoices)?.cashier_name|| 'Non défini' }}
        </p>
      </div>
      <div class="text-right text-sm text-gray-500">
        <p><strong>Date :</strong>{{ formatDate(invoices.find(c => c.id === selectedInvoices)?.created_at) ||'N/A' }} </p>
        <p><strong>Facture ID :</strong> {{ selectedInvoices }}</p>
      </div>
    </div>

    <!-- Détails Produits -->
    <div v-if="invoiceDetails.length > 0">
      <DataTable :value="invoiceDetails" class="p-datatable-sm shadow-sm rounded-md">
        
        <Column field="product_name" header="Produit" style="min-width: 200px;">
          <template #body="slotProps">
            <span class="font-medium">{{ slotProps.data.product_name }}</span>
          </template>
        </Column>

        <Column field="price" header="Prix U">
          <template #body="slotProps">
            {{ userProfile ? userProfile.currency_preference : '' }}
            {{ formaPrice(slotProps.data.price) }}
          </template>
        </Column>

        <Column field="quantity" header="Qté" style="width: 80px; text-align: center;">
          <template #body="slotProps">
            {{ slotProps.data.quantity }}
          </template>
        </Column>

        <Column header="Total">
          <template #body="slotProps">
            {{ userProfile ? userProfile.currency_preference : '' }}
            {{ formaPrice(slotProps.data.price * slotProps.data.quantity) }}
          </template>
        </Column>

      </DataTable>
    </div>

    <!-- Total général -->
    <div class="flex justify-end mt-6 border-t pt-4">
      <div class="text-right">
        <p class="text-lg font-bold">
          Total :
          <span class="text-green-600">
            {{ userProfile ? userProfile.currency_preference : '' }}
            {{ invoices.find( c=> c.id === selectedInvoices)?.total_amount || 'N/A'}}
          </span>
        </p>
      </div>
    </div>
    
  </div>
</Dialog>


    </div>
</template>