<script setup>
import { fetchPayements } from "@/service/Api";
import { formatDate } from "@/utils/formatters";
import { computed, onMounted, ref } from "vue";



const payments = ref([])
const totol_collected = ref(0);
const total_collected_balance = ref(0);
const total_colletected_today = ref(0);
const total_collected_mpessa = ref(0);
const total_collected_aitel = ref(0);
const total_collected_orange=ref(0);
const today = new Date().toISOString().split('T')[0]
const selectedFilter = ref('today');
const fileteredPayments = ref([]);
const searchQuery= ref("");
// pagination 
const currentPage = ref(1);
const itemsPerPage= ref(6);


const paginatedPatements = computed(() => {
    const start = (currentPage.value - 1 ) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return searchPayments.value.slice(start, end);
})

const totalPages = computed(() => 
 Math.ceil(searchPayments.value.length / itemsPerPage.value)
)

function nextPage(){
    if(currentPage.value < totalPages.value) currentPage.value ++;
}
function prevPage(){
    if(currentPage.value > 1) currentPage.value --;
}

// fin du systeme de pagination
const searchPayments = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if(!query) return fileteredPayments.value;

    return fileteredPayments.value.filter(py => 
        String(py.id).includes(query) ||
        py.phone?.toLowerCase().includes(query)||
        py.transaction_reference?.toLowerCase().includes(query)
    );
});

async function getPayments(){
    const response = await fetchPayements();
    payments.value = response;
    applyFilter();

    const filterPayments = payments.value.filter(
        py => py.status ==='SUCCESS'
    )

    const  paymentToDay = payments.value.filter(
        py => new Date(py.created_at).toISOString().split('T')[0] ===  today &&
        py.status  ==='SUCCESS'
    )

    console.log('payments to days :', paymentToDay)
    totol_collected.value = filterPayments.reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
    )
    total_collected_balance.value = parseFloat(filterPayments.reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
        ).toFixed(2)
    )
    
    total_colletected_today.value = parseFloat(paymentToDay.reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
        ).toFixed(2)
    )
}


function filterByDate(payments, filter){
    const now = new Date();
    
    return payments.filter(py => {
        
        const paymentsDate = new Date(py.created_at);

        if(filter === 'today'){
            return paymentsDate.toDateString() === now.toDateString();
        }
        if(filter === '7days'){
            const past = new Date();
            past.setDate(now.getDate() -7);
            return paymentsDate >= past;
        }
        if(filter == '30days'){
            const past = new Date();
            past.setDate(now.getDate() - 30);
            return paymentsDate >= past;
        }

        if(filter === 'all'){
            return true;
        }
        return true
    })
}


function applyFilter(){
    const filtered = filterByDate(payments.value, selectedFilter.value);
    fileteredPayments.value = filterByDate(payments.value, selectedFilter.value);

    total_colletected_today.value = parseFloat(filtered.reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
      ).toFixed(2)
    )
 
}


onMounted(() => {
    getPayments();
})


const getProviderLogo = (provider) => {
    if(!provider) return "";
    provider = provider.toLowerCase()
    if (provider.includes("mpesa") || provider.includes("vodacom")){
        return "https://upload.wikimedia.org/wikipedia/commons/0/03/M-pesa-logo.png"
    }
    if(provider.includes("visa")){
        return "https://www.reussir-mon-ecommerce.fr/wp-content/uploads/2016/03/ancien-logo-visa-1-1024x389.png"
    }
    if(provider.includes("airtel")){
        return "https://upload.wikimedia.org/wikipedia/commons/3/3a/Airtel_logo-01.png"
    }
    if(provider.includes("orange")){
        return "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg"
    }
    return "";
} 

</script>

<template>

        <div class="p-6 space-y-6 bg-gray-100 min-h-screen">

        <!-- HEADER -->
        <div class="bg-white rounded-xl shadow p-5 flex justify-between items-center">

        <div class="flex items-center gap-3">

        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        
        </div>

        <div>
        <h1 class="text-xl font-bold">Mobile payment - USD</h1>
        <p class="text-sm text-gray-500">
        TOTAL : <span class="font-semibold text-blue-600">{{ totol_collected }} USD</span>
        </p>
        </div>

        </div>

        <div class="flex gap-3">


        <button class="px-4 py-2 border rounded-lg text-red-600 border-red-600">
        PDF
        </button>

        <button class="px-4 py-2 border rounded-lg">
        ⟳
        </button>
        </div>

        </div>

        <!-- FILTRES -->
        <div class="bg-white rounded-xl shadow p-4 flex justify-between items-center">

        <div class="flex gap-2">

        <button 
            @click="selectedFilter='today'; applyFilter()"
            :class="selectedFilter==='today' ? 'bg-blue-600 text-white' : ''"
            class="px-3 py-1 border rounded-lg">
            Aujourd’hui
        </button>

        <button 
            @click="selectedFilter='7days'; applyFilter()"
            :class="selectedFilter==='7days' ? 'bg-blue-600 text-white' : ''"
            class="px-3 py-1 border rounded-lg">
            7 jours
        </button>


        <button 
            @click="selectedFilter='30days'; applyFilter()"
            :class="selectedFilter==='30days' ? 'bg-blue-600 text-white' : ''"
            class="px-3 py-1 border rounded-lg">
            30 jours
        </button>

        <button 
            @click="selectedFilter='all'; applyFilter()"
            :class="selectedFilter==='all' ? 'bg-blue-600 text-white' : ''"
            class="px-3 py-1 border rounded-lg">
            Tout
        </button>

        <button class="px-3 py-1 border rounded-lg">
        Personnalisé
        </button>

        </div>

        <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher : ID, Téléphone, Nom..."
        class="border rounded-lg px-3 py-2 w-72"
        />

        </div>

        <!-- STATS -->
        <div class="grid grid-cols-3 gap-6">

        <!-- TOTAL -->
        <div class="bg-white rounded-xl shadow p-5">

        <h3 class="text-gray-500 text-sm">Total Collecté</h3>

        <p class="text-2xl font-bold text-blue-600 mt-2">
        {{ totol_collected }}  USD
        </p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs font-medium">

        <span class="px-3 py-1 rounded-lg bg-green-100 text-green-700">
       
        </span>

        <span class="px-3 py-1 rounded-lg bg-red-100 text-red-600">
        
        </span>

        <span class="px-3 py-1 rounded-lg bg-orange-100 text-orange-600">
        
        </span>

        </div>

        </div>


        <!-- SOLDE -->
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">

        <h3 class="text-gray-500 text-sm">Solde Disponible</h3>

        <p class="text-2xl font-bold text-blue-600 mt-2">
        {{ total_collected_balance }} USD
        </p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs font-medium">

        <span class="px-3 py-1 rounded-lg bg-green-100 text-green-700">
        MPESA :  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-red-100 text-red-600">
        AIRTEL :  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-orange-100 text-orange-600">
        ORANGE : USD
        </span>

        </div>

        </div>


        <!-- SUCCESS -->
        <div class="bg-green-50 rounded-xl shadow p-5 border-l-4 border-green-500">

        <h3 class="text-green-600 text-sm">Transactions Réussies : {{ formatDate(today) }}</h3>

        <p class="text-2xl font-bold text-green-700 mt-2">
        {{ total_colletected_today }} USD
        </p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs font-medium">

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        MPESA :  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        AIRTEL :  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        ORANGE : USD
        </span>

        </div>

        </div>

        </div>

        <!-- TABLE -->
        <div class="bg-white rounded-xl shadow overflow-hidden" >

        <table class="w-full text-sm">

        <thead class="bg-gray-50 text-gray-600">

        <tr>

            <th class="p-3 text-left">ID</th>
            <th class="p-3 text-left">OPÉRATEUR</th>
            <th class="p-3 text-left">CLIENT</th>
            <th class="p-3 text-left">MONTANT</th>
            <th class="p-3 text-left">STATUT</th>
            <th class="p-3 text-left">DATE</th>
            <th class="p-3 text-left">ACTIONS</th>

        </tr>

        </thead>

        <tbody>

        <tr
            v-for="p in paginatedPatements"
            :key="p.id"
            class="border-t hover:bg-gray-50"
            >

        <td class="p-3 text-blue-600 font-semibold">
        #{{ p.id }}
        </td>

        <td class="p-3 flex items-center gap-2">

        <img
        :src="getProviderLogo(p.provider)"
        class="h-6"
        />

        <span class="font-medium">
        {{ p.provider }}
        </span>

        </td>

        <td class="p-3">

        <div class="font-medium">
        {{ p.client_name }}
        </div>

        <div class="text-gray-400 text-xs">
          {{ p.phone }}
        </div>

        </td>

        <td class="p-3 font-semibold text-blue-600">
        {{ p.amount }} USD
        </td>

        <td class="p-3">

        <span v-if="p.status ==='SUCCESS'"
        class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg"
        >
        {{ p.status }}
        </span>
        <span v-else
        class="px-2 py-1 text-xs bg-orange-500 text-green-700 rounded-lg"
        >
        {{ p.status }}
        </span>



        </td>

        <td class="p-3">

        <div>
        {{ p.date }}
        </div>

        <div class="text-xs text-gray-400">
        {{ formatDate(p.created_at) }}
        </div>

        </td>

        <td class="p-3">

        <button
        class="border px-2 py-1 rounded hover:bg-gray-100"
        >
         <i class="pi pi-eye"></i>
        </button>

        </td>

        </tr>

        </tbody>

        </table>
        <div class="flex justify-between items-center mt-4 px-4 py-3 bg-white rounded-xl shadow">

        <!-- Bouton précédent -->
        <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded disabled:opacity-40"
        >
            Précédent
        </button>

        <!-- Infos de pagination -->
        <div class="text-sm text-gray-600">
            Page {{ currentPage }} / {{ totalPages }}
        </div>

        <!-- Bouton suivant -->
        <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border rounded disabled:opacity-40"
        >
            Suivant
        </button>

        </div>

        </div>

        </div>

</template>