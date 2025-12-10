

<script setup>
import {
  checkSecretKeyStatus,
  checkSubsrictionStatus,
  createUserAPI,
  deleteUserAPI,
  fetchUserProfilById,
  getUsersCreatedByMe,
  updateUserAPI,
  updateUserProfile,
  verifySecretKey
} from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
 
const toast = useToast();
const dt  = ref();
const users = ref([]);
const user = ref({});
const userDialog = ref(false);
const submitted =  ref(false);
const router = useRouter();
const isSuperuser = localStorage.getItem('is_superuser') === 'true';
const deleteDialog = ref(false);
const userToDelete = ref(null);

const selectedUser = ref({});
const userProfile = ref({});
const hasSecretKey = ref(false);
const secretDialog = ref(false);
const deleteMode = ref(null);
const submittedSecret = ref(false);
const secretKey = ref('')

const isSubscription = ref(false);

const isSaving = ref(false);

const userStatusType = ref({})


const editForm = reactive({
  first_name: "",
  last_name: "",
  email: "",

  // profil
  entrep_name: "",
  phone_number: "",
  adress: "",
  rccm_number: "",
  impot_number: "",
  id_nat:"",
});

 const isSuperUser = localStorage.getItem('is_superuser') === 'true';

const userDetailDialog =ref(false);

onMounted(async () => {
   fetchedUser();
   checkSecretKey();
   checkSubscription();
   
   
});


// verification de l'abonnement de l'utilisateur
async function checkSubscription(){
 
  try{
    const res = await checkSubsrictionStatus()
    isSubscription.value = res.has_sub || false
    if(isSubscription.value == true){
      userStatusType.value = [
            {label:'ADMIN', value:'ADMIN'},
            {label:'CAISSIER', value:'CAISSIER'},
            {label:'GESTIONNAIRE_STOCK', value:'GESTIONNAIRE_STOCK'}
      ]
    }else if(isSubscription.value ==false){
      userStatusType.value =[
          {label:'CAISSIER', value:'CAISSIER'},
          {label:'GESTIONNAIRE_STOCK', value:'GESTIONNAIRE_STOCK'}
      ]
    }
    
    
  }catch(error){
    console.error("errur lors de la verification", error)
  }

}

// fonction pour verifier le code secret 
async function verifySecret(){
  submittedSecret.value = true;
  if(!secretKey.value) return;
  try{
    const isValid = await verifySecretKey(secretKey.value);
    if(isValid.valid){
       toast.add({ severity:'success', summary:'Succès', detail:'Code secret validé', life:3000 });
      secretDialog.value = false;
      secretKey.value = "";
      if(deleteMode.value ==="DELETE"){
        deleteUser();
      }
    }else{
       toast.add({ severity:'error', summary:'Erreur', detail:'Code secret invalide', life:3000 });
    }
  }catch(error){
    console.error("Erreur lors de la verification du code secret", error);
  }

}

async function checkSecretKey(){
  try{
    const res = await checkSecretKeyStatus();
    hasSecretKey.value = res.has_key || false;
    
  }catch(error){
    console.error("Erreur lors de la verification du code", error)
  }
}


async function fetchedUser() {
  try {
    const currentUserId = localStorage.getItem('id');
    const isCurrentUserSuperuser = localStorage.getItem('is_superuser');

    let fechedUsers = [];

    if (isCurrentUserSuperuser === 'true') {
      
      fechedUsers = await getUsersCreatedByMe()
      fechedUsers = fechedUsers.filter(user => String(user.id) !== String(currentUserId));
    } else {
      
      fechedUsers = await getUsersCreatedByMe();
      console.log('Utilisateur enfants :', fechedUsers)
    }

    users.value = fechedUsers;

  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs', error);
  }
}

function confirmDeleteUser(user){
   userToDelete.value = user;
   deleteDialog.value = true

}

function askSecretForDelete(){
  deleteDialog.value = false;
  if(hasSecretKey.value == true){
     deleteMode.value ="DELETE";
     secretDialog.value = true;
  }else{
    deleteDialog.value = true;
    deleteUser();
  }
}


async function openUserDetail(userId){
  selectedUser.value = userId;
  const result = await fetchUserProfilById(selectedUser.value.id)
  userProfile.value = Array.isArray(result) ? result[0] : result;


  editForm.first_name = selectedUser.value.first_name;
  editForm.last_name = selectedUser.value.last_name;
  editForm.email = selectedUser.value.email;

  editForm.entrep_name = userProfile.value.entrep_name;
  editForm.phone_number = userProfile.value.phone_number;
  editForm.adress = userProfile.value.adress;
  editForm.rccm_number = userProfile.value.rccm_number;
  editForm.impot_number = userProfile.value.impot_number;
  editForm.id_nat = userProfile.value.id_nat;
  
  
  userDetailDialog.value = true;
}

async function submitUserUpdate() {
  try {
    isSaving.value = true;


    const profilePayload = {
      user: selectedUser.value.id,
      entrep_name: editForm.entrep_name,
      phone_number: editForm.phone_number,
      adress: editForm.adress,
      rccm_number: editForm.rccm_number,
      impot_number: editForm.impot_number,
      id_nat:editForm.id_nat
    };

    await updateUserProfile(profilePayload);

    // -------------------------
    // 3. Succès
    // -------------------------
    toast.add({
      severity: "success",
      summary: "Modification réussie",
      detail: "Les informations ont été mises à jour.",
      life: 2500,
    });

    userDetailDialog.value = false;
   

  } catch (error) {
    console.error("Erreur :", error);

    toast.add({
      severity: "error",
      summary: "Erreur",
      detail: "Impossible de sauvegarder les modifications.",
      life: 3000,
    });

  } finally {
    isSaving.value = false;
  }
}


async function deleteUser(){
    if(!userToDelete.value) return

    try{
       const result = await deleteUserAPI(userToDelete.value.id);
        user.value = users.value.filter(u=> u.id !== userToDelete.value.id);
         toast.add({ severity: 'success', summary: 'Supprimé', detail: result.message, life: 3000 });
         fetchedUser();
    } catch(error){
       console.error('Erreur lors de la suppression de l\'utilisateur', error);
       toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression', life: 3000 });
    } finally{
      deleteDialog.value =false;
      userToDelete.value=null;
    }
}


// function pour sauvegarder l'utilisateur 

async function saveUser() {
  submitted.value = true;

  const isCreating = !user.value.id;

  if (
    user.value.name &&
    user.value.email &&
    (
      (isCreating && user.value.password && user.value.confirPasswor) || !isCreating
    )
  ) {
    if (isCreating && user.value.password !== user.value.confirPasswor) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas', life: 3000 });
      return;
    }

    const userData = {
      username: user.value.name,
      email: user.value.email,
      status:user.value.status
      
    };

    if (isCreating) {
      userData.password = user.value.password;
    }

    try {
      if (user.value.id) {
        // Mise à jour
        const updateUseri = await updateUserAPI(user.value.id, userData);
        const index = users.value.findIndex(u => u.id === user.value.id);
        if (index !== -1) {
          users.value[index] = updateUseri;
        }
        toast.add({ severity: 'success', summary: 'Modifié', detail: 'Utilisateur modifié avec succès', life: 3000 });
      } else {
        // Création
        const result = await createUserAPI(userData);

        if (result.error) {
          if (result.status === 403) {
            toast.add({ severity: 'warn', summary: 'Limite atteinte', detail: result.data.detail, life: 5000 });
          } else if (result.status === 400) {
            const errors = result.data;
            const errorMessages = Object.values(errors).flat().join(' ');
            toast.add({ severity: 'error', summary: 'Erreur de validation', detail: errorMessages, life: 5000 });
          } else {
            toast.add({ severity: 'error', summary: 'Erreur', detail: result.message || 'Erreur inconnue', life: 5000 });
          }
          return; // Stop l’exécution
        }

        users.value.push(result);
        toast.add({ severity: 'success', summary: 'Créé', detail: result.message || 'Utilisateur créé avec succès', life: 3000 });
      }

      userDialog.value = false;
      user.value = {};
      submitted.value = false;
      await fetchedUser();

    } catch (error) {
      console.error('Erreur création utilisateur', error);
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l’opération', life: 3000 });
    }

  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Complétez tous les champs requis', life: 3000 });
  }
}



function editUser(seleectedUser){
    user.value = {
        id:seleectedUser.id,
        name:seleectedUser.username,
        email: seleectedUser.email,
    };

    submitted.value = false;
    userDialog.value = true;
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
    if (!value) return 'Non défini';
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
    user.value = {};
    submitted.value = false;
}

</script> 


<template>


   <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Nouveau Utilissateur" icon="pi pi-user-plus" severity="primary" class="mr-2" @click="openNew" />
                </template>

                <template #end>
                    <Button label="Actualiser" icon="pi pi-refresh" security="primary" class="m-2" @click="refreshPage"/>
                </template>

            </Toolbar>

        </div>

         <div
                v-if="users.length === 0"
                class="text-center py-16 text-gray-400"
            >
                <i class="pi pi-inbox text-5xl mb-3"></i>
                <p class="text-lg">Aucun utilisateur trouver</p>
        </div>

        <DataTable
        v-else
                ref="dt"
                :value="users"
                dataKey="id"
                :paginator="true"
                :rows="10"
               
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Factures "
            >

            
                <Column field="id" header="ID" sortable style="min-width: 2rem"></Column>
                <Column field="username" header="NON UTILISATEUR"  ></Column>
                <Column field="first_name" header="NOM " >
                  <template #body="slotProps">
                        {{ slotProps?.data.first_name || 'N/A' }} {{ slotProps?.data.last_name }}
                  </template>
                </Column>
                <Column field="email" header="EMAIL" sortable style="min-width: 8rem"></Column>

                <Column field="status" header="STATUS" sortable style="min-width: 8rem">
                  <template #body="slotProps">
                    <span
                      :class="[
                      'px-2 py-1 rounded text-white text-sm font-semibold',
                      {
                        'bg-green-500': slotProps.data.status === 'ADMIN',
                        'bg-orange-600': slotProps.data.status === 'CAISSIER',
                        'bg-indigo-900': slotProps.data.status === 'GESTIONNAIRE_STOCK'
                      }
                    ]"
                    >
                    {{ slotProps.data.status }}
                    </span>
                  </template>
                </Column>
                
                <Column field="date_joined" header=" CREATION " sortable style="min-width: 12rem">
                   <template #body="slotProps">
                    {{ formatDate(slotProps.data.date_joined)}}
                   </template>
                </Column>

                <Column field="inventoryStatus" header="ACTION" sortable style="min-width: 12rem">
                    <template #body="slotProps">

                        <Button 
                        v-if="isSuperuser"
                        icon="pi pi-eye" 
                        label="voir" outlined rounded class="mr-2" @click="viewUser(slotProps.data.id)" />

                        <Button 
                        v-if="!isSuperuser"
                        icon="pi pi-ellipsis-v" 
                        label="Details" 
                        outlined 
                        rounded 
                        class="mr-2"
                        severity="info"
                         @click="openUserDetail(slotProps.data)" />

                        <Button 
                          icon="pi pi-trash" 
                          severity="danger" 
                          rounded 
                          outlined 
                          @click="confirmDeleteUser(slotProps.data)" 
                      />
                      
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
        
                <div class="grid grid-cols-12 gap-4" v-if="!user.id">
                    <div class="col-span-6">
                        <label for="password" class="block font-bold mb-3">Mot de paase</label>
                        <InputText id="password" v-model="user.password"  type="password" required="true"/>
                    </div>

                    <div class="col-span-6">
                        <label for="password" class="block font-bold mb-3">Confirme Mot de passe</label>
                        <InputText id="password" v-model="user.confirPasswor" type="password" required="true"/>
                        <small v-if="submitted && user.password != user.confirPasswor" class="text-red-500">Le mot de pass doit etre le même</small>
                    </div>
                  <div v-if="!isSuperUser" class="col-span-6">
                      <label class="block font-bold mb-2">STATUS</label>
                      <Select v-model="user.status"
                      :options="userStatusType"
                       optionLabel="label" 
                       optionValue="value" 
                       placeholder="STATAUS" fluid />
                    </div>
                </div>


            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveUser" />
            </template>
        </Dialog>


<Dialog 
  v-model:visible="userDetailDialog" 
  :modal="true"
  header="Utilisateur"
  :style="{ width: '600px' }"
  class="p-0"
>
  <TabView>

    <!-- ========================= -->
    <!--       ONGLET DETAIL       -->
    <!-- ========================= -->
    <TabPanel header="Détails">
      <div class="flex flex-col items-center py-4 px-4">

        <!-- AVATAR -->
        <Avatar 
          :label="selectedUser?.username?.charAt(0).toUpperCase()" 
          size="large"
          class="mb-3"
          style="background:#e5a046;color:white;width:70px;height:70px;font-size:26px;"
        />

        <!-- NOM -->
        <h2 class="text-xl font-semibold text-gray-800">
          {{ selectedUser?.first_name }} {{ selectedUser?.last_name }}
        </h2>

        <!-- ROLE -->
        <Tag 
          :value="selectedUser?.status" 
          :severity="selectedUser?.status === 'ADMIN' ? 'success' : 'info'"
          class="mt-2 px-3 py-1 text-sm"
        />

        <Divider />

        <!-- INFORMATIONS UTILISATEUR -->
        <div class="w-full space-y-3">

          <div class="flex justify-between">
            <span class="font-medium">Nom d'utilisateur :</span>
            <span>{{ selectedUser?.username }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">Email :</span>
            <span>{{ selectedUser?.email }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">Date de création :</span>
            <span>{{ new Date(selectedUser?.date_joined).toLocaleDateString() }}</span>
          </div>

        </div>

        <Divider />
        <h3 class="text-lg font-semibold text-gray-800">POINT DE VENTE</h3>

        <div class="w-full space-y-3">

          <div class="flex justify-between">
            <span class="font-medium">Nom :</span>
            <span>{{ userProfile?.entrep_name }}</span>
          </div>

         <div class="flex justify-between">
            <span class="font-medium">ID Nat :</span>
            <span>{{ userProfile?.id_nat }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">Téléphone :</span>
            <span>{{ userProfile?.phone_number }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">Adresse :</span>
            <span>{{ userProfile?.adress }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">RCCM :</span>
            <span>{{ userProfile?.rccm_number }}</span>
          </div>

          <div class="flex justify-between">
            <span class="font-medium">Numéro Impot :</span>
            <span>{{ userProfile?.impot_number }}</span>
          </div>

        </div>

      </div>
    </TabPanel>


    <!-- ================================ -->
    <!--      ONGLET MODIFICATION         -->
    <!-- ================================ -->
    <TabPanel header="Modifier">
      <div class="px-4 py-4 space-y-4">

        <!-- FORMULAIRE POINT DE VENTE -->
        <h3 class="text-lg font-semibold text-gray-800">Point de vente</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label class="font-medium">Nom entreprise</label>
            <InputText v-model="editForm.entrep_name" class="w-full" />
          </div>
       
          <div>
            <label class="font-medium">ID Nat</label>
            <InputText v-model="editForm.id_nat" class="w-full" />
          </div>

          <div>
            <label class="font-medium">Téléphone</label>
            <InputText v-model="editForm.phone_number" class="w-full" />
          </div>

          <div>
            <label class="font-medium">Adresse</label>
            <InputText v-model="editForm.adress" class="w-full" />
          </div>

          <div>
            <label class="font-medium">RCCM</label>
            <InputText v-model="editForm.rccm_number" class="w-full" />
          </div>

          <div>
            <label class="font-medium">Impot</label>
            <InputText v-model="editForm.impot_number" class="w-full" />
          </div>

        </div>

        <!-- BOUTONS -->
        <div class="flex justify-end gap-2 mt-4">
          <Button 
            label="Annuler" 
            class="p-button-text"
            @click="userDetailDialog = false"
          />
          <Button 
            label="Enregistrer"
            icon="pi pi-check"
            class="p-button-success"
            :loading="isSaving"
            @click="submitUserUpdate"
          />
        </div>

      </div>
    </TabPanel>

  </TabView>

</Dialog>
      <Dialog 
        v-model:visible="secretDialog" 
        header="Entrer le code secret" 
        :modal="true" 
        :closable="false" 
        :style="{ width: '90%', maxWidth: '350px' }"
      >
        <div class="flex flex-col gap-2">
          <label for="secret" class="font-medium">Code secret</label>
          <InputText 
            id="secret" 
            v-model.trim="secretKey" 
            :class="{ 'p-invalid': submittedSecret && !secretKey }" 
            autofocus
            @keyup.enter="verifySecret"
          />
          <small v-if="submittedSecret && !secretKey" class="p-error">
            Le code secret est requis.
          </small>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button 
              label="Annuler" 
              icon="pi pi-times" 
              text 
              @click="secretDialog = false" 
            />
            <Button 
              label="Valider" 
              icon="pi pi-check" 
              severity="success" 
              @click="verifySecret" 
            />
          </div>
        </template>
      </Dialog>



      
        <Dialog v-model:visible="deleteDialog" :style="{ width: '350px' }" header="Confirmation" :modal="true">
        <span>Voulez-vous vraiment supprimer l'utilisateur <strong>{{ userToDelete?.username }}</strong> ?</span>
        <template #footer>
            <Button label="Non" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Oui" icon="pi pi-check" severity="danger" @click="askSecretForDelete" />
        </template>
    </Dialog>

</template>