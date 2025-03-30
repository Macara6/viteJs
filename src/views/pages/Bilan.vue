

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { fetchInvoices, fetchUsers } from '@/service/Api';
import jsPDF from 'jspdf';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const pieData = ref(null);
const pieOptions = ref(null);
const lineData = ref(null);
const lineOptions = ref(null);
const invoices = ref([]);
const total_Amount = ref(0)
const users = ref([]);
const today = new Date().toISOString().split('T')[0];
const selectDate = ref({
    global:{ value:today }
})
onMounted( async ()=>{
    invoices.value =  await fetchInvoices();
    users.value = await fetchUsers();
    calculateTotalAmount();
    setColorOptions();
    updateLineData()
    
});

function getWeekRange(date){
    const start = new Date(date);
    const end = new Date(date);

    start.setDate(start.getDate() - start.getDay() +1);
    end.setDate(end.getDate() - start.getDay() +7);
    return { start, end };
}

const todaysInvoices= computed(() =>{
    const selectedDate = selectDate.value.global.value;  
    return invoices.value.filter(invoice =>{
        const invoiceData = new Date(invoice.created_at);
        return invoiceData.toISOString().split('T')[0] === selectedDate;
    });
  
});

const todaysInvoicesCount = computed(()=> todaysInvoices.value.length);

function calculateTotalAmount(){
    total_Amount.value = 0;
    todaysInvoices.value.forEach(invoice => {
        if(invoice.total_amount !=null && !isNaN(invoice.total_amount)) {
            total_Amount.value += Number(invoice.total_amount);
        }
    });
    console.log('Tatl amount for today :', total_Amount.value);
}
// function to generaate PDF raport
function generatePDF(){
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Invoice Raport',14,20);
    doc.setFontSize(12);
    doc.text(`Date: ${selectDate.value.global.value}`, 14,30);
    doc.text(`Total Invoices: ${todaysInvoicesCount.value}`,14,40);
    doc.text(`Total Amount: ${formatPrice(total_Amount.value)} Fc`, 14,50);

    doc.text('Invoices:',14,60);
    todaysInvoices.value.forEach((invoice, index) => {
        doc.text(`Invoice ID: ${invoice.id}, Client: ${invoice.client_name},Amount: ${formatPrice(invoice.total_amount)} Fc`,14,70+ (10 * index));
    });
    doc.save('invoive_raport.pdf');
}


function changeDate(date){
   selectDate.value.global.value = date;
    setColorOptions();
    calculateTotalAmount();
    updateLineData();
}
function formatPrice(price){
    if(price !== null && price !==undefined){
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}

function setColorOptions(){
    const documentStyle = getComputedStyle(document.documentElement);

    lineOptions.value ={
       responsive: true,
       plugins: {
         legend:{
            position: 'top',
        },

        title: {
           display: true,
           text:'Factures de la semaine'
         },
       },
    };

    const userInvoiceCounts = {};
    const selectedDate = new Date(selectDate.value.global.value).toISOString().split('T')[0];
 
     console.log('today is', today);

    invoices.value.forEach(invoice => {
        const invoiceDate = new Date(invoice.created_at).toISOString().split('T')[0];

        if(invoiceDate === selectedDate){
            
            const userId = invoice.cashier;

            if(userInvoiceCounts[userId]){
                userInvoiceCounts[userId] +=1;
            }else{
                userInvoiceCounts[userId] = 1;
            }
        }
    });
    const labels = [];
    const data = [];
    users.value.forEach(user => {
        const userId = user.id;
        labels.push(user.username);
        data.push(userInvoiceCounts[userId] || 0);
    })
    
    console.log('Date is',data);

    pieData.value = {
        labels: labels,
        datasets: [
            {
                data: data,
                backgroundColor:[
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

    pieOptions.value = {
        responsive: true,
        plugins: {
            Legend: {
                position:'top',
            },
            title:{
                display: true,
                text:'Factures par categorie',
            },
        },
    };

}

function updateLineData(){
    const { start, end } = getWeekRange(selectDate.value.global.value);
    const labels = [];
    const data = [];

    for(let d =  new Date(start); d<= end; d.setDate(d.getDate() + 1)){
        const dateString = d.toISOString().split('T')[0];
        labels.push(new Date(d).toLocaleDateString());

        const dailyInvoices = invoices.value.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at).toISOString().split('T')[0];
            return invoiceDate === dateString;
        });
        data.push(dailyInvoices.length);
    }

    lineData.value = {
        labels:labels,
        datasets: [
            {
                label: `Facture crées`,
                data:data,
                fill: false,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4,
            },
        ],
    };
}


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
                        <span class="block text-muted-color font-medium mb-4">Total facture {{ selectDate.global.value }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ todaysInvoicesCount }}</div>
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
                        <span class="block text-muted-color font-medium mb-4">Total </span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{formatPrice(total_Amount) }} FC</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        FC
                    </div>
                </div>
                <span class="text-primary font-medium">Tota pour aujourd'huit </span>
                <span class="text-muted-color">{{ selectDate.global.value }}</span>
            </div>
        </div>


        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Utilisateurs (Caissers)</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">444</div>
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
                <label for="year-select" class="mr-2">Select Date:</label>
                <InputText type="date" v-model="selectDate.global.value" @change="changeDate(selectDate.global.value)" />
            </div>
            
            <div class="card">
                <div class="font-semibold text-xl mb-4">Factures  pour la semaine du au  </div>
                <Chart type="line" :data="lineData" :options="lineOptions"></Chart>
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <div class="flex flex-col xl:flex-row items-center mb-4">
            
              <div class="font-semibold text-xl mb-4">
                <Button label="Generer le Rapport" severity="success" @click="generatePDF"/>
              </div>
            </div>
            <div class="card flex flex-col items-center">
                <div class="font-semibold text-xl mb-4">Factues Par caisseir pour </div>
                
                <Chart type="doughnut" :data="pieData" :options="pieOptions"></Chart>
            </div>
        </div>

    </div>
</template>