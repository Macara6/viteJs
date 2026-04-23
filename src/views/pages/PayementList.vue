<script setup>
import { fetchPayements } from "@/service/Api";
import { formatDate } from "@/utils/formatters";
import { computed, onMounted, ref } from "vue";



const payments = ref([])
const totol_collected = ref(0);
const total_collected_balance = ref(0);
const total_colletected_today = ref(0);

const total_collected_aitel_today = ref(0);
const total_collected_mpessa_today = ref(0);
const total_collected_orange_today = ref(0);

const total_collected_mpessa = ref(0);
const total_collected_aitel = ref(0);
const total_collected_orange=ref(0);


const total_colleted_pending = ref(0);
const today = new Date().toISOString().split('T')[0]
const selectedFilter = ref('today');
const fileteredPayments = ref([]);
const searchQuery= ref("");
// pagination 
const currentPage = ref(1);
const itemsPerPage= ref(6);

onMounted(() => {
    getPayments();
   
})

// chart
const chartData = computed(() => {
  const filtered = filterByDate(searchPayments.value, selectedFilter.value);

  const providers = [...new Set(filtered.map(p => p.provider))];

  const successData = [];
  const pendingData = [];

  providers.forEach(provider => {
    let success = 0;
    let pending = 0;

    filtered.forEach(p => {
      if (p.provider === provider) {
        if (p.status === 'SUCCESS') {
          success += Number(p.amount || 0);
        } else {
          pending += Number(p.amount || 0);
        }
      }
    });

    successData.push(success);
    pendingData.push(pending);
  });

  return {
    labels: providers,
    datasets: [
      {
        label: "Succès",
        data: successData,
        backgroundColor: "#22c55e" // vert
      },
      {
        label: "En attente",
        data: pendingData,
        backgroundColor: "#86efac" // vert clair
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true
    }
  }
};
// fin du chart

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
   
    const  paymentToDay = filterPayments.filter(
        py => new Date(py.created_at).toISOString().split('T')[0] ===  today  
    )

   

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
    // operateurs
   total_collected_mpessa.value = filterPayments
            .filter(py => py.provider === 'mpesa')
            .reduce((sum, pymt) => sum + parseFloat(pymt.amount || 0),0)
            .toFixed(2)
    total_collected_aitel.value = filterPayments
            .filter(py => py.provider ==='airtel')
            .reduce((sum, pymt) => sum + parseFloat(pymt.amount || 0),0)
            .toFixed(2)
    total_collected_orange.value = filterPayments
            .filter(py => py.provider === 'orange')
            .reduce((sum, pymt) => sum + parseFloat(pymt.amount || 0), 0)
            .toFixed(2)
    // opeateurs today
    total_collected_mpessa_today.value = parseFloat(paymentToDay.filter(
        py => py.provider ==='mpesa'
       ).reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
        ).toFixed(2)
    )
    total_collected_aitel_today.value = paymentToDay
            .filter(py => py.provider ==='airtel')
            .reduce((sum, pymt) => sum + parseFloat(pymt.amount || 0), 0)
            .toFixed(2)

    total_collected_orange_today.value = paymentToDay
            .filter(py => py.provider === 'orange')
            .reduce((sum, pymt) => sum + parseFloat(pymt.amount || 0),0)
            .toFixed(2)
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

    total_colletected_today.value = parseFloat(filtered.filter(py => py.status ==='SUCCESS').reduce(
        (sum, pymt) => sum + parseFloat(pymt.amount || 0),
        0
      ).toFixed(2)
    )

    total_colleted_pending.value = parseFloat(filtered.filter(py => py.status ==='PENDING').reduce(
        (sum, pymt) => sum +parseFloat(pymt.amount || 0),
        0
    ).toFixed(2)
  )
}










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
   <!--
        <button class="px-3 py-1 border rounded-lg">
        Personnalisé
        </button>
    --->
        </div>

        <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher : ID, Téléphone"
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
         MPESA : {{ total_collected_mpessa }} USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-red-100 text-red-600">
        AIRTEL : {{ total_collected_aitel }}  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-orange-100 text-orange-600">
         ORANGE : {{ total_collected_orange }} USD
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
        MPESA : {{ total_collected_mpessa }} USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-red-100 text-red-600">
        AIRTEL : {{ total_collected_aitel }}  USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-orange-100 text-orange-600">
        ORANGE : {{ total_collected_orange }} USD
        </span>

        </div>

        </div>


        <!-- SUCCESS -->
        <div class="bg-green-50 rounded-xl shadow p-5 border-l-4 border-green-500">

        <h3 class="text-green-600 text-sm">Transactions Réussies : {{ formatDate(today) }}</h3>

            <p class="text-2xl font-semibold mt-2">
            <span class="text-green-700">
                {{ total_colletected_today }} USD
            </span>
            <span class="mx-2 text-gray-400">|</span>
            <span class="text-yellow-600">
                {{ total_colleted_pending }} USD
            </span>
            </p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs font-medium">

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        MPESA : {{ total_collected_mpessa_today }} USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        AIRTEL : {{ total_collected_aitel_today }} USD
        </span>

        <span class="px-3 py-1 rounded-lg bg-green-200 text-green-800">
        ORANGE : {{ total_collected_orange_today }} USD
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

        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">
                Paiements par opérateur
                </div>

                <Chart 
                type="bar" 
                :data="chartData" 
                :options="chartOptions" 
                />
            </div>
        </div>

        </div>

</template>