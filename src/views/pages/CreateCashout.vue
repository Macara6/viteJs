

<script setup>
import { createCashOutAPI, fetchUserProfilById } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

 const isSuperUser = localStorage.getItem('is_superuser') === 'true';
 const userProfile = ref(null);
    
    const motif = ref('');
    const toast = useToast();
    const details = ref([
        {reason: '', amount:null}
    ]);

    const router = useRouter();
    
    const addDetail = ()=>{
        details.value.push({reason:'',amount: null});
    };

    const removeDetail =(index) =>{
        details.value.splice(index, 1);
    }

    const handleCreatCashOut = async () =>{
        const userId = parseInt(localStorage.getItem('id'));
        const validDatails = details.value.filter(
            (d) => d.reason && d.reason.trim() !=='' && d.amount !== null && d.amount !==''
        );
        if(validDatails.length ===0){
            toast.add({severity:'error', summary:'Erreur',detail:'Veuillez ajouter un detail valide', life:3000});
        }
        const total = details.value.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const payload = {
            user_id:userId,
            motif:motif.value,
            total_amount: total,
            detail_inputs: details.value,

        };  
        try{
            await createCashOutAPI(payload);
            toast.add({severity:'success', summary:'Sussessful',detail:'Bon de sortie créé ',life:3000});
        
            motif.value = '';
            details.value =[{reason:'', amount:''}];
        } catch(error){
            console.log('Erreur lors de la création', error);
        }
    }

    async function fetchUserProfil() {
        const userId = localStorage.getItem('id');
        try{
           const result = await fetchUserProfilById(userId);
            userProfile.value = Array.isArray(result) ? result[0] : result;
        }catch(error){
         console.error('Erreur lors de la récuperation du profi utilisateur', error);
        }
        
    }
onMounted(async () => {
    await fetchUserProfil();
})

</script>


<template>
    <Fluid>
 
        <div class="flex mt-8">
            <div class="card flex flex-col gap-4 w-full">
                <div class="font-semibold text-xl">Nouveu Bon de sortie</div>

                <div class="flex flex-wrap gap-2 w-full">
                    <label for="motif">Demandeur</label>
                    <InputText id="motif" type="text" v-model="motif" />
                </div>

                <div v-for="(detail, index) in details" :key="index" class="flex flex-col md:flex-row gap-4">
                <div class="flex flex-col w-full">
                    <label>Motif</label>
                    <InputText v-model="detail.reason" placeholder="Ex: Achat carburant" />
                </div>
                <div class="flex flex-col w-full">

                    <label v-if="isSuperUser">Montant USD</label>
                    <label v-else>Montant {{ userProfile ? userProfile.currency_preference : 'N/A' }}</label>
                    <InputText  v-model="detail.amount" type="number" />
                </div>
                <div class="flex items-end">
                    <Button icon="pi pi-trash" severity="danger" @click="removeDetail(index)" />
                </div>
                </div>

                <Button label="Ajouter un détail" icon="pi pi-plus" @click="addDetail" class="w-fit" />
                <Button label="Créer le Bon de sortie" class="mt-4" @click=" handleCreatCashOut" />
              
            </div>
        </div>
    </Fluid>
</template>