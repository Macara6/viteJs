
<script setup>
import { deleteUserForCorb, fetchTrashedUser, restoreUser } from "@/service/Api";
import { formatDate } from "@/utils/formatters";
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";


const toast = useToast();
const users = ref([]);
const loading = ref(false);


const loadUsers = async () => {
    loading.value = true;
    try{
        users.value = await fetchTrashedUser();

    }catch(error){
        toast.add({
            severity: "error",
            summary: "Erreur",
            detail: "Impossible de charger la corbeille.",
            life: 3000,
        });
    }finally{
        loading.value = false;
    }

}

const handleRestore = async (id) =>{
    try{
        const result = await restoreUser(id);
        if(result.error){
            if(result.status === 403){
                 toast.add({ severity: 'warn', summary: 'Limite atteinte', detail: result.data.detail, life: 5000 });
            }
            return;
        }


         toast.add({
            severity: "success",
            summary: "Utilisateur restauré",
            detail: result.message,
            life: 3000,
        });
        

        await loadUsers();

    }catch(error){

        toast.add({
            severity: "error",
            summary: "Erreur",
            detail: "Impossible de restaurer l’utilisateur.",
            life: 3000,
        });
    }
}

const handleDeleteForever = async (id) => {
    try{
        const result = await deleteUserForCorb(id);

        toast.add({
            severity: "warn",
            summary: "Suppression définitive",
            detail: result.message,
            life: 3000,
        });
        await loadUsers();
    }catch(erro){
        toast.add({
            severity: "error",
            summary: "Erreur",
            detail: "Impossible de supprimer définitivement cet utilisateur.",
            life: 3000,
        });
    }
}

onMounted(() => loadUsers());



</script>



<template>
    <div class="p-5">
        <div class="flex items-center gap-3 mb-5">
            <i class="pi pi-trash text-red-500 text-3xl"></i>
            <h1 class="text-3xl font-bold text-gray-700">Corbeille</h1>
        </div>

        <div class="card shadow-lg p-4 rounded-xl bg-white">
            
            <!-- Loader -->
            <div v-if="loading" class="text-center py-10">
                <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
                <p class="mt-3 text-gray-500">Chargement...</p>
            </div>

            <!-- Aucun utilisateur -->
            <div
                v-else-if="users.length === 0"
                class="text-center py-16 text-gray-400"
            >
                <i class="pi pi-inbox text-5xl mb-3"></i>
                <p class="text-lg">Aucun utilisateur dans la corbeille.</p>
            </div>

            <!-- Tableau -->
            <div v-else class="overflow-auto">
                <table class="w-full border-collapse mt-3">
                    <thead>
                        <tr class="bg-gray-100 text-left">
                            <th class="p-3">Nom</th>
                            <th class="p-3">Email</th>
                            <th class="p-3">Rôle</th>
                            <th class="p-3">Date suppression</th>
                            <th class="p-3"> Date d'expiration</th>
                            <th class="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="user in users"
                            :key="user.id"
                            class="hover:bg-gray-50 border-b"
                        >
                            <td class="p-3 font-medium">{{ user.username }}</td>
                            <td class="p-3">{{ user.email }}</td>
                            <td class="p-3">{{ user.status }}</td>
                            <td class="p-3"> {{formatDate(user.deleted_at) }}</td>
                            <td lang="p-3"> {{formatDate(user.permanent_delete_at) }}</td>

                            <td class="p-3 text-center flex gap-2 justify-center">
                                <Button
                                    label="Restaurer"
                                    icon="pi pi-replay"
                                    class="p-button-success p-button-sm"
                                    @click="handleRestore(user.id)"
                                />
                                <Button
                                    label="Supprimer"
                                    icon="pi pi-times"
                                    class="p-button-danger p-button-sm"
                                    @click="handleDeleteForever(user.id)"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    border-radius: 14px;
}
table th {
    font-weight: 600;
    color: #444;
}
</style>