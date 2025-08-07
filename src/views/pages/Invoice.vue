<script setup>

import { fetchInvoicesAllChildrent, fetchInvoicesAllUsers, fetchUsers } from '@/service/Api';
import { FilterMatchMode } from '@primevue/core';
import { onMounted, ref } from 'vue';



const invoices = ref([]);
const invoice = ref({});
const users =  ref({});
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS}
});
const deleteInvoiceDialog = ref(false);
const deleteInvoicesDialog = ref(false);
const selectedInvoices = ref();

const showOnlyChildren = ref(false);


onMounted (async () =>{
   await loadInvoiceAndAdmin();
});

function sortInvoicesByDate(){

    invoices.value.sort((a,b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    }); 
}


async function loadInvoiceAndAdmin(){
    try {
        const [fetchedUsers, invoicesData] = await Promise.all([
            fetchUsers(),
            showOnlyChildren.value ? fetchInvoicesAllChildrent(true) : fetchInvoicesAllUsers()
        ]);

        console.log('Invoices:', invoicesData);

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
    deleteInvoiceDialog.value = true;

}
function confirmDeleteSelected(){
    deleteInvoicesDialog.value = true;
}

function deleteSelectedInvoices(){
    invoices.value = invoices.value.filter((val) => !selectedInvoices.value.includes(val));
    deleteInvoicesDialog.value = false;
    selectedInvoices.value = null;
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
                <Column field="id" header="ID" sortable style="min-width: 12rem"></Column>
                <Column field="client_name" header="Nom Client(e)" sortable style="min-width: 16rem"></Column>
                <Column field="cashier_name" header="Cassier(e)" sortable style="min-width: 8rem">
             
                </Column>
                <Column field="total_amount" header="Total" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                            {{formaPrice(slotProps.data.total_amount) }} Fc
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
                <Column field="created_at" header="Date" sortable style="min-width: 8rem">
                  <template #body = "slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                  </template>
                </Column>
                <Column field="inventoryStatus" header="Action" sortable style="min-width: 12rem">
                    <template #body="">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2"  />
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
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedInvoices" />
            </template>
        </Dialog>
    </div>
</template>