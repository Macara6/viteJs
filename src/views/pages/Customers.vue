
<script setup>
import { createCustomer, deleteCustomerAPI, downloadCard, fetchCustomer, fetchUserProfilById } from '@/service/Api';
import { formatDate, formatLoyaltyCard } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const customers = ref([]);
const customer = ref({});
const customerDialog = ref(false);
const submitted = ref(false);
const userProfile = ref(null);
const deleteClient = ref(false);
const deleteMode = ref("");

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const customerSexe = [
    {label:'M',value:'M'},
    {label:'F', value:'F'}
]



onMounted(() =>{
    getCustomer();
    fetchUserProfl();
})


async function getCustomer(){
    const response = await fetchCustomer();
    customers.value = response;
    console.log("client pour cette utilisateur :", customers.value);
}

async function fetchUserProfl(){
    const userId = localStorage.getItem('id');
    try{
      const result = await fetchUserProfilById(userId);
      userProfile.value = Array.isArray(result) ? result[0] : result;
    } catch(error){
      console.error('Erreur lors du chargement du profile utilisateur', error);
    }
}

async function deleteCustomer(){
  try{
    await deleteCustomerAPI(customer.value.id);
    await getCustomer();
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Client supprimée', life: 3000 });
    deleteClient.value = false;
  }catch(error){
    console.error('error to delete customer:', error);
  }
}

async function confirmDelete(custo){
  customer.value = custo;
  deleteClient.value = true;
}

function openNew(){
    submitted.value = false;
    customerDialog.value = true
}

function hideDialog(){
    customerDialog.value = false;
    submitted.value = false;
}

async function saveCustomer(){
    submitted.value = true;
    const { name,last_name, phone_number, email, sexe } = customer.value;

    if( !name || !last_name || !phone_number ){
      toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields', life: 3000 });
      return;
    }

    if(phone_number){
        const phoneNumberExists = customers.value.some(c => c.phone_number === phone_number );
        if(phoneNumberExists){
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Ce Numéro est déjà utilisé.', life: 3000 });
            return;
        }
    }
    try{
        const userCreated = localStorage.getItem('id');
        const customeData = { ...customer.value,created_by: userCreated};
        await createCustomer(customeData);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Client Créer', life: 3000 });
        await getCustomer();
        hideDialog();
        customer.value ='';
    }catch(error){
        console.error('Error saving customer', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Erreur lors de la créations', life: 3000 });
    }
}


</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Liste des Clients</div>

  <DataTable
    :value="customers"
    scrollable
    :filters="filters"
    :globalFilterFields="['name','last_name','phone_number','loyalty_card_number']"
    scrollHeight="400px"
    class="mt-6"
  >

      <template #header>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">

          <div class="flex gap-3 items-center">
             <Button
                label="Nouveau Client"
                icon="pi pi-plus"
                class="p-button-outlined"
                @click="openNew"
            />
            
          </div>
          <div class="flex flex-wrap gap-3 items-center justify-end w-full sm:w-auto">
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

        <Column field="id" header="Id" style="min-width: 10px"></Column>


        <Column field=""   header="Nom & Post-Nom" style="min-width: 150px"> 
        <template #body="slotProps">
          {{ slotProps.data.name}} - {{ slotProps.data.last_name }}
        </template>
        </Column>

        <Column field="sexe" header="Sexe" style="min-width: 20px" /> 

        <Column field="phone_number" header="Téléphone" style="min-width: 100px"/> 

        <Column field="created_at" header="Date création" style="min-width: 100px">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>

        <Column field="" header="Points" style="min-width: 50px">
         <template #body="{ data}">
             {{ data.balance_point }} Pts
         </template>
        </Column>
        <Column field="" header="Valeur" style="min-width: 50px" >
            <template #body="{ data }">
                {{ data.total_value_points }} {{ userProfile?.currency_preference || '' }}
            </template>
        </Column>

        <Column field="loyalty_card_number" header="Numero Carte" style="min-width: 100px" >
         <template #body="{ data }">
            {{ formatLoyaltyCard(data.loyalty_card_number) }}
         </template>
        </Column>

        <Column header="ACTION" style="min-width: 150px">
          <template #body="{ data }">

           <Button 
           label="Carte" 
           class="p-button-sm"
           icon="pi pi-id-card"
            @click="downloadCard(data.id)" />

            <Button
              icon="pi pi-trash"
              class="p-button-sm"
              severity="danger"
              @click="confirmDelete(data)"
            />
          </template>
        </Column>
      </DataTable>
    

            <!-- Dialogs -->
    <Dialog v-model:visible="customerDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Client" :modal="true">
      <div class="flex flex-col gap-4">

        <div>
          <label class="block font-bold mb-2">Nom</label>
          <InputText v-model.trim="customer.name" :invalid="submitted && !customer.name" fluid autofocus />
          <small v-if="submitted && !customer.name" class="text-red-500 text-sm">Name is required.</small>
        </div>

        <div>
          <label class="block font-bold mb-2">Post-Nom</label>
          <InputText v-model.trim="customer.last_name" :invalid="submitted && !customer.last_name" fluid autofocus />
          <small v-if="submitted && !customer.last_name" class="text-red-500 text-sm">last_name is required.</small>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

         <div>
            <label class="block font-bold mb-2">Téléphone </label>
             <InputText v-model.trim="customer.phone_number" :invalid="submitted && !customer.phone_number" fluid autofocus />
            <small v-if="submitted && !customer.phone_number" class="text-red-500 text-sm">phone number is required.</small>
          </div>
         <div>
            <label class="block font-bold mb-2">Email </label>
             <InputText id="email" v-model="customer.email" type="email" placeholder="exmple@gmail.com" required="false"/>
          </div>
         <div  class="col-span-6">
            <label class="block font-bold mb-2">Sexe</label>
            <Select v-model="customer.sexe"
                :options="customerSexe"
                optionLabel="label" 
                optionValue="value" 
                placeholder="Sexe" fluid
            />
        </div>


        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="customerDialog = false" />
        <Button label="Save" icon="pi pi-check" @click="saveCustomer" />
      </template>
    </Dialog>


    <Dialog v-model:visible="deleteClient" :style="{ width: '90%', maxWidth: '450px' }" header="Confirm" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Are you sure you want to delete <b>{{ customer.name }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
        <Button label="Yes" icon="pi pi-check" @click="deleteCustomer" />
      </template>
    </Dialog>

</div>

</template>