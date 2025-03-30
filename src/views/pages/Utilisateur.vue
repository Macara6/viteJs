

<script setup>
import { createUserAPI, fetchUsers } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
 
const toast = useToast();
const dt  = ref();
const users = ref([]);
const user = ref({});
const userDialog = ref(false);
const submitted =  ref(false);
const router = useRouter();




onMounted(async () => {
   fetchedUser();
   
});

async function fetchedUser(){

    try{
        users.value = await fetchUsers();

    }catch (error){
        console.error('There aws a problem with the fetch operation', error);
    }
}

async function saveUser(){
    submitted.value = true;
    if(user.value.name && user.value.email && user.value.password && user.value.confirPasswor){

    try{
        const userData ={
            username:user.value.name,
            email:user.value.email,
            
            password:user.value.password
        };
        console.log('User Date', userData);

        const createUser =  await createUserAPI(userData);
        users.value.push(createUser);
        toast.add({ severity: 'success', summary: 'Successful', detail: 'User Created', life: 3000 });

    } catch ( error){
        console.error('Error creating  user',error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create product', life: 3000 }); 
    }

    }else{
        console.log('Error');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Compter tout les champs', life: 3000 }); 
    }
} 
function viewUser(userId){
    console.log('Navigating to user detail with ID:', userId);
    router.push({name: 'userDetail', params: {id: userId}});
}

function refreshPage(){
    users.value =[];
    fetchedUser();
}

function formatDate(value){
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const date = new Date(value);
    return date.toLocaleString('sv-SE', options).replace(' ',' ');
}
function openNew(){
   
    userDialog.value = true;
}
function hideDialog(){
    userDialog.value = false;
}

</script> 


<template>
   <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Nouveau Utilissateur" icon="pi pi-user-plus" severity="primary" class="mr-2" @click="openNew" />
                    <Button label="Effacer" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <Button label="Actualiser" icon="pi pi-refresh" security="primary" class="m-2" @click="refreshPage"/>
                </template>

            </Toolbar>
        </div>

        <DataTable
                ref="dt"
                :value="users"
                dataKey="id"
                :paginator="true"
                :rows="10"
               
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Factures "
            >

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="id" header="ID" sortable style="min-width: 12rem"></Column>
                <Column field="username" header="Nom Utilisateur" sortable style="min-width: 16rem"></Column>
                
                <Column field="email" header="Email" sortable style="min-width: 8rem">
                
                </Column>

            
                <Column field="date_joined" header=" Créer " sortable style="min-width: 12rem">
                   <template #body="slotProps">
                    {{ formatDate(slotProps.data.date_joined)}}
                   </template>
                </Column>

                <Column field="inventoryStatus" header="Action" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" label="voir" outlined rounded class="mr-2" @click="viewUser(slotProps.data.id)" />

                    </template> 
                </Column>

        </DataTable>    

   </div> 
   
   <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="Nouveau Utilisateur" :modal="true">
            <div class="flex flex-col gap-6">
            
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="name" class="block font-bold mb-3">Nom du compte</label>
                        <InputText id="name" v-model.trim="user.name"  required="true" autofocus :invalid="submitted && !user.name" fluid />
                        <small v-if="submitted && !user.name" class="text-red-500">Le nom est obligatoire</small>
                    </div>
                    <div class="coll-span-6">
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <InputText id="email" v-model="user.email" type="email" placeholder="exmple@gmail.com" required="true"/>
                    </div>
                </div>
            

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="password" class="block font-bold mb-3">Mot de paase</label>
                        <InputText id="password" v-model="user.password"  type="password" required="true"/>
                    </div>

                    <div class="col-span-6">
                        <label for="password" class="block font-bold mb-3">Confirme Mot de passe</label>
                        <InputText id="password" v-model="user.confirPasswor" type="password" required="true"/>
                        <small v-if="submitted && user.password != user.confirPasswor" class="text-red-500">Le mot de pass doit etre le même</small>
                    </div>

                </div>


            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveUser" />
            </template>
        </Dialog>

</template>