
<script setup>
import { useLayout } from '@/layout/composables/layout';
import { fetchInvoices, fetchProduits, fetchUsers } from '@/service/Api';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const pieData = ref(null);
const pieOptions = ref(null);
const lineData = ref(null);
const lineOptions = ref(null);
const invoices = ref([]);
const products = ref([]);
const users = ref([]);
const totalProducts = ref(0);
const totalInvoices = ref(0);
const totalUsers = ref(0);
const selectedYear = ref(new Date().getFullYear());
const total_Amount = ref(0);

onMounted(() => {
  loadProductAndInvoice();
});

async function loadProductAndInvoice() {
  products.value = await fetchProduits();
  invoices.value = await fetchInvoices();
  users.value = await fetchUsers();
  totalProducts.value = products.value.length;
  totalInvoices.value = invoices.value.length;
  totalUsers.value = users.value.length;
  
  setColorOptions(); 
  calculateTotalAmount();
}



function setColorOptions() {
  const documentStyle = getComputedStyle(document.documentElement);
  const monthlyInvoiceCount = Array(12).fill(0); // Array to hold sales for each month

  invoices.value.forEach(invoice => {
    const invoiceData = new Date(invoice.created_at); // Ensure this is the correct field
    const month = invoiceData.getMonth(); // Get the month (0-11)
  
    
    if(invoiceData.getFullYear() === selectedYear.value){
      monthlyInvoiceCount[month] +=1;
    }

  });
 

  lineData.value = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: `Factures mensuelles créées ${selectedYear.value}`,
        data: monthlyInvoiceCount,
        fill: false,
        backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
        borderColor: documentStyle.getPropertyValue('--p-primary-600'),
        tension: 0.4,
      },
    ],
  };

    const userInvoiceCounts = {};

    invoices.value.forEach(invoice =>{
      const invoiceDate = new Date(invoice.created_at);
      if(invoiceDate.getFullYear() == selectedYear.value){
        const userId = invoice.cashier;

        if(userInvoiceCounts[userId]){
          userInvoiceCounts[userId] += 1;
        } else {
          userInvoiceCounts[userId] = 1;
        }
      } 
     
    });
    // preparer les donnees pour la chart
    const labels = [];
    const data = [];
    users.value.forEach(user => {
      const userId = user.id;
      labels.push(user.username);
      data.push(userInvoiceCounts[userId] || 0);
    })

    console.log('data is ',data);
    
    pieData.value = {
        labels: labels,
        datasets: [
            {
                data: data,
                backgroundColor: [
                  documentStyle.getPropertyValue('--p-indigo-500'), // Dark Indigo
                  documentStyle.getPropertyValue('--p-blue-500'),    // Bright Blue
                  documentStyle.getPropertyValue('--p-green-500'),   // Bright Green
                  documentStyle.getPropertyValue('--p-red-500'),     // Bright Red
                  documentStyle.getPropertyValue('--p-yellow-500'),  // Bright Yellow
                  documentStyle.getPropertyValue('--p-orange-500'),  // Bright Orange
                  documentStyle.getPropertyValue('--p-purple-500'),   // Bright Purple
                  documentStyle.getPropertyValue('--p-teal-500'),     // Teal
                  documentStyle.getPropertyValue('--p-gray-500'),     // Gray
                  documentStyle.getPropertyValue('--p-brown-500'),    // Brown
                ],
                hoverBackgroundColor: [
                  documentStyle.getPropertyValue('--p-indigo-400'), // Light Indigo
                  documentStyle.getPropertyValue('--p-blue-400'),    // Light Blue
                  documentStyle.getPropertyValue('--p-green-400'),   // Light Green
                  documentStyle.getPropertyValue('--p-red-400'),     // Light Red
                  documentStyle.getPropertyValue('--p-yellow-400'),  // Light Yellow
                  documentStyle.getPropertyValue('--p-orange-400'),  // Light Orange
                  documentStyle.getPropertyValue('--p-purple-400'),   // Light Purple
                  documentStyle.getPropertyValue('--p-teal-400'),     // Light Teal
                  documentStyle.getPropertyValue('--p-gray-400'),     // Light Gray
                  documentStyle.getPropertyValue('--p-brown-400'),    // Light Brown
                ]
             }
        ]
    };

}

function calculateTotalAmount(){
  total_Amount.value = 0;
  invoices.value.forEach(invoice =>{
   const invoiceDate = new Date(invoice.created_at);
   if(invoiceDate.getFullYear() == selectedYear.value){

    if( invoice.total_amount != null && !isNaN(invoice.total_amount)){
      total_Amount.value += Number(invoice.total_amount);

      console.log('total amount:', total_Amount);
       }
     }
  });
}


function changeYear(year){
   selectedYear.value = year;
   setColorOptions();
   calculateTotalAmount();
}
function formartPrice(price){
    if(price !== null && price !==undefined){
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}
// Watch for layout changes
watch(
  [getPrimary, getSurface, isDarkTheme],
  () => {
    setColorOptions();
  },
  { immediate: true }
);
</script>




<template>
  
  <div class="grid grid-cols-12 gap-8">

    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Produits</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalProducts }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-shopping-cart text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">24 new </span>
                <span class="text-muted-color">since last visit</span>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Factures</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalInvoices }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        
                    </div>
                </div>
                <span class="text-primary font-medium">Tota factures </span>
                <span class="text-muted-color"> </span>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Utilisateurs (Caissers)</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalUsers }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium"> </span>
                <span class="text-muted-color">newly registered</span>
            </div>
        </div>
        
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Comments</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152 Unread</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-comment text-purple-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">85 </span>
                <span class="text-muted-color">responded</span>
            </div>
        </div>
      
        <div class="col-span-12 xl:col-span-6">
          <div class="flex flex-col xl:flex-row items-center mb-4">
                <label for="year-select" class="mr-2">Select Year:</label>
                <select id="year-select" 
                v-model="selectedYear"
                 @change="changeYear(selectedYear)"
                  class="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                 >
                  <option v-for="year in [2024,2025,2026]" :key="year" :value="year">{{ year }}</option>
                </select>
            </div>
            
            <div class="card">
                <div class="font-semibold text-xl mb-4">Factures mensuelles pour l'annee {{ selectedYear }}</div>
                <Chart type="line" :data="lineData" :options="lineOptions"></Chart>
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <div class="flex flex-col xl:flex-row items-center mb-4">
            
              <div class="font-semibold text-xl mb-4">Total  {{ formartPrice(total_Amount) }} Fc / {{ selectedYear }}</div>
            </div>
            <div class="card flex flex-col items-center">
                <div class="font-semibold text-xl mb-4">Factues Par caisseir pour {{ selectedYear }}</div>
                
                <Chart type="doughnut" :data="pieData" :options="pieOptions"></Chart>
            </div>
        </div>
  
       
       
     
  </div>


</template>

<style scoped>
 /* Custom CSS */
#year-select {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  outline: none;
  transition: border-color 0.2s;
}

#year-select:focus {
  border-color: #007bff; /* Change to your desired focus color */
}
</style>