

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { fetchInvoices, fetchUserById } from '@/service/Api';
import jsPDF from 'jspdf';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const pieData = ref(null);
const pieOptions = ref(null);
const lineData = ref(null);
const lineOptions = ref(null);
const invoices = ref([]);
const total_Amount = ref(0)
const user = ref(null);
const today = new Date().toISOString().split('T')[0];
const selectDate = ref({
    global:{ value:today }
})


onMounted( async ()=>{
    const userId = localStorage.getItem('id');

    invoices.value =  await fetchInvoices(userId);
    user.value = await fetchUserById(userId);
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

function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// function to generaate PDF raport
 async function generatePDF(){
    const  userName = localStorage.getItem('username')
    const doc = new jsPDF();
    const marginLeft = 14;
    let y = 20;


    const logoUrl = '/demo/bilatech.png'; // Par exemple : '/assets/logo.png'

        const logoImage = await loadImageAsBase64(logoUrl);
        if (logoImage) {
            doc.addImage(logoImage, 'PNG', marginLeft, y, 30, 30); // x, y, largeur, hauteur
            y += 35;
        }
// titre 
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de facturation quotidien',marginLeft, y);
    y +=10;

    // info general 
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Caissier(e): ${userName}`, marginLeft,y);
    y +=8
    doc.text(`Date: ${selectDate.value.global.value}`, marginLeft,y);
    y +=8;
    doc.text(`Total factures: ${todaysInvoicesCount.value}`,marginLeft, y);
    y +=8;
    doc.text(`Montant total: ${formatPrice(total_Amount.value)} Fc`, marginLeft,y);
    y +=12;

    doc.setDrawColor(0);
    doc.line(marginLeft, y, 200, y);
    y += 10;

        // En-tête du tableau
    doc.setFont('helvetica', 'bold');
    doc.text('ID', marginLeft, y);
    doc.text('Client', marginLeft + 20, y);
    doc.text('Montant (Fc)', marginLeft + 100, y);
    doc.text('Retour (Fc)', marginLeft + 160, y)
    y += 8;
    
    doc.setFont('helvetica', 'normal');

    todaysInvoices.value.forEach((invoice, index) => {
        doc.text(`${invoice.id}`, marginLeft, y);
        doc.text(`${invoice.client_name}`, marginLeft + 20, y);
        doc.text(`${formatPrice(invoice.total_amount)} fc`, marginLeft + 100, y);
        doc.text(`${formatPrice(invoice.change)} fc`, marginLeft + 160, y);
        y += 8;

        // Saut de page si nécessaire
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    

    doc.save(`daily_invoice_report_.pdf`);

   
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
function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);

    lineOptions.value = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Factures de la semaine'
            },
        },
    };

    const userInvoiceCounts = {};
    const selectedDate = new Date(selectDate.value.global.value).toISOString().split('T')[0];

    invoices.value.forEach(invoice => {
        const invoiceDate = new Date(invoice.created_at).toISOString().split('T')[0];
        if (invoiceDate === selectedDate) {
            const userId = invoice.cashier;
            userInvoiceCounts[userId] = (userInvoiceCounts[userId] || 0) + 1;
        }
    });

    const labels = [];
    const data = [];

    if (user.value) {
        const userId = user.value.id;
        labels.push(user.value.username);
        data.push(userInvoiceCounts[userId] || 0);
    }

    pieData.value = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-indigo-500'),
                    documentStyle.getPropertyValue('--p-blue-500'),
                    documentStyle.getPropertyValue('--p-green-500'),
                    documentStyle.getPropertyValue('--p-red-500'),
                    documentStyle.getPropertyValue('--p-yellow-500'),
                    documentStyle.getPropertyValue('--p-orange-500'),
                    documentStyle.getPropertyValue('--p-purple-500'),
                    documentStyle.getPropertyValue('--p-teal-500'),
                    documentStyle.getPropertyValue('--p-gray-500'),
                    documentStyle.getPropertyValue('--p-brown-500'),
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-indigo-400'),
                    documentStyle.getPropertyValue('--p-blue-400'),
                    documentStyle.getPropertyValue('--p-green-400'),
                    documentStyle.getPropertyValue('--p-red-400'),
                    documentStyle.getPropertyValue('--p-yellow-400'),
                    documentStyle.getPropertyValue('--p-orange-400'),
                    documentStyle.getPropertyValue('--p-purple-400'),
                    documentStyle.getPropertyValue('--p-teal-400'),
                    documentStyle.getPropertyValue('--p-gray-400'),
                    documentStyle.getPropertyValue('--p-brown-400'),
                ]
            }
        ]
    };

    pieOptions.value = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Factures par catégorie',
            },
        },
    };
}


function updateLineData() {
    const { start, end } = getWeekRange(selectDate.value.global.value);
    const labels = [];
    const data = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d); // éviter mutation
        const dateString = currentDate.toISOString().split('T')[0];
        labels.push(currentDate.toLocaleDateString());

        const dailyInvoices = invoices.value.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at).toISOString().split('T')[0];
            return invoiceDate === dateString;
        });

        data.push(dailyInvoices.length);
    }

    lineData.value = {
        labels,
        datasets: [
            {
                label: 'Factures créées',
                data,
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
  { immediate: true , deep :false}
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