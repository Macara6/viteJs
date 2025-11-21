




<script setup>
import { createEntryNote, fetchUserProfilById } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';



 const supplier_name = ref('');
 const toast = useToast();
 const details = ref([
    {reason:'', amount:null}
 ]);
const userProfile = ref(null);
const addDetail =()=>{
    details.value.push({reason:'',amount:null});
};

const removeDetail =(index) =>{
    details.value.splice(index, 1);
}
 const isSuperUser = localStorage.getItem('is_superuser') === 'true';

const handleCreateEntryNote = async ()=>{
    const userId = parseInt(localStorage.getItem('id'));
    const validDetails = details.value.filter(
        (d) => d.reason && d.reason.trim() !=='' && d.amount !==null && d.amount !==''
    );
    if(validDetails.length ===0){
        toast.add({severity:'error', summary:'Erreur',detail:'Veuillez ajouter un detail valide', life:3000});
    }

    const total = details.value.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const payload = {
        user_id:userId,
        supplier_name:supplier_name.value,
        total_amount:total,
        detail_inputs:details.value
    };

    try{
        await createEntryNote(payload);
        toast.add({severity:'success', summary:'Sussessful',detail:"Bon d'entrée créé ",life:3000});
        supplier_name.value='';
        details.value = [{reason:'',amount:''}];
    }catch(error){
        console.log('Erreur de creation du bon ',eroor);
    }
}
async function fetchedUserProfil(){
    const userId = localStorage.getItem('id');
    try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        console.log('profile utilisateur :', userProfile.value)
    }catch(error){
        console.error('errur lors de la recuperation du profiles', error);
    }
}

onMounted(async () => {
    await fetchedUserProfil();
})

</script>

<template>
<Fluid>
 

 <div class="flex mt-8">
     <div class="card flex flex-col gap-4 w-full">
         <div class="font-semibold text-xl">Nouveu Bon d'entrée</div>

         <div class="flex flex-wrap gap-2 w-full">
             <label for="motif">Client(e)</label>
             <InputText id="motif" type="text" v-model="supplier_name" />
         </div>

         <div v-for="(detail, index) in details" :key="index" class="flex flex-col md:flex-row gap-4">
         <div class="flex flex-col w-full">
             <label>Motif</label>
             <InputText v-model="detail.reason" placeholder="Ex: abonnement" />
         </div>
         <div class="flex flex-col w-full">
             <label v-if="isSuperUser">Montant USD</label>
             <label v-else>Montant {{ userProfile ? userProfile.currency_preference : 'N/A' }} </label>
             <InputText v-model="detail.amount" type="number" placeholder="Montant " />
         </div>
         <div class="flex items-end">
             <Button icon="pi pi-trash" severity="danger" @click="removeDetail(index)" />
         </div>
         </div>

         <Button label="Ajouter un détail" icon="pi pi-plus" @click="addDetail" class="w-fit" />
         <Button label="Créer le Bon d'entré" class="mt-4" @click=" handleCreateEntryNote" />
       
     </div>
 </div>
</Fluid>
</template>