
<script setup>
import { useLayout } from '@/layout/composables/layout';
import { fetchCashOut, fetchInvoicesAllUsers, fetchUserById, fetchUserProfilById, getUsersCreatedByMe } from '@/service/Api';
import jsPDF from 'jspdf';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

// --- Références ---
const pieData = ref(null);
const pieOptions = ref(null);
const lineData = ref(null);

const invoices = ref([]);
const cashoutList = ref([]);
const invoicesUserConnect = ref([]);
const total_Amount = ref(0);

const selectDate = ref({ global:{ value: new Date().toISOString().split('T')[0] } });

const user = ref({}); // utilisateur connecté
const userProfile = ref(null);
const allUsers = ref([]);
const childUsers = ref([]);

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

const cacheKey = (name) => `cache_${name}`;
const saveCache = (name, data) => localStorage.setItem(cacheKey(name), JSON.stringify({ data, timestamp: Date.now() }));
const loadCache = (name) => {
    const cached = localStorage.getItem(cacheKey(name));
    if (!cached) return null;
    try {
        const payload = JSON.parse(cached);
        if (Date.now() - payload.timestamp < CACHE_EXPIRATION_MS) return payload.data;
        localStorage.removeItem(cacheKey(name));
        return null;
    } catch { return null; }
};

onMounted(async () => {
    const userId = localStorage.getItem('id');

    // Utilisateur connecté
    user.value = loadCache('userConnected') || await fetchUserById(userId);
    if (!loadCache('userConnected')) saveCache('userConnected', user.value);
    await loadUserProfile(userId);
    await loadInvoices();
    await loadCashOut();
    await loadChildUsers();

    // Calculs et graphiques
    calculateTotalAmount();
    calculateCashoutTotalAmount();
    setColorOptions();
    updateLineData();
});

async function loadUserProfile(userId) {
    const cached = loadCache('userProfile');
    if (cached) { userProfile.value = cached; return; }
    try {
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        saveCache('userProfile', userProfile.value);
    } catch (error) { console.error('Erreur récupération profil utilisateur', error); }
}

async function loadInvoices() {
    const cachedInvoices = loadCache('invoices');
    const cachedInvoicesUser = loadCache('invoicesUserConnect');
    if (cachedInvoices && cachedInvoicesUser) {
        invoices.value = cachedInvoices;
        invoicesUserConnect.value = cachedInvoicesUser;
        return;
    }
    try {
        const allInvoices = await fetchInvoicesAllUsers();
        invoices.value = allInvoices;
        const userId = parseInt(localStorage.getItem('id'));
        invoicesUserConnect.value = allInvoices.filter(i => i.cashier === userId);
        saveCache('invoices', invoices.value);
        saveCache('invoicesUserConnect', invoicesUserConnect.value);
    } catch (error) { console.error('Erreur récupération factures', error); }
}

async function loadCashOut() {
    const cached = loadCache('cashoutList');
    if (cached) { cashoutList.value = cached; return; }
    try {
        const userId = localStorage.getItem('id');
        const data = await fetchCashOut(userId);
        cashoutList.value = data;
        saveCache('cashoutList', cashoutList.value);
    } catch (error) { console.error('Erreur récupération cashout', error); }
}

async function loadChildUsers() {
    const cached = loadCache('childUsers');
    if (cached) { childUsers.value = cached; return; }
    try {
        const userId = parseInt(localStorage.getItem('id'));
        const users = await getUsersCreatedByMe();
        const children = users.filter(u => u.created_by === userId);
        childUsers.value = children;
        saveCache('childUsers', children);
    } catch (error) { console.error('Erreur récupération utilisateurs enfants', error); }
}

// --- Calculs ---
const todaysInvoices = computed(() => {
    const selectedDate = selectDate.value.global.value;  
    return invoices.value.filter(inv => new Date(inv.created_at).toISOString().split('T')[0] === selectedDate);
});

const todaysInvoicesUserConnect = computed(() => {
    const selectedDate = selectDate.value.global.value;  
    return invoicesUserConnect.value.filter(inv => new Date(inv.created_at).toISOString().split('T')[0] === selectedDate);
});

const todayCashouts = computed(() => {
    const selectedDate = selectDate.value.global.value;  
    return cashoutList.value.filter(cash => new Date(cash.created_at).toISOString().split('T')[0] === selectedDate);
});

const todaysCashoutCount = computed(() => todayCashouts.value.length);
const todaysInvoiesUserConnectCaount = computed(() => todaysInvoicesUserConnect.value.length);
const todaysInvoicesCount = computed(()=> todaysInvoices.value.length);

function calculateTotalAmount() {
    total_Amount.value = todaysInvoices.value.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
}

const total_AmountUserConnect = computed(() => todaysInvoicesUserConnect.value.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0));
const total_AmountCashOut = computed(() => todayCashouts.value.reduce((sum, cashout) => sum + (Number(cashout.total_amount) || 0), 0));
const total_ProfitAmount = computed(() => todaysInvoicesUserConnect.value.reduce((sum, inv) => sum + (Number(inv.profit_amount) || 0), 0));

function calculateCashoutTotalAmount() {
    total_AmountCashOut.value = todayCashouts.value.reduce((sum, cashout) => sum + (Number(cashout.total_amount) || 0), 0);
}

// --- PDF ---
function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

async function generatePDF() {
    const userName = localStorage.getItem('username');
    const doc = new jsPDF();
    const marginLeft = 14;
    let y = 20;
    const logoImage = await loadImageAsBase64('/demo/bilatech.png');
    if (logoImage) { doc.addImage(logoImage,'PNG', marginLeft, y, 30,30); y += 35; }

    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.text('Rapport de facturation quotidien', marginLeft, y); y+=10;
    doc.setFontSize(12);
    doc.text(`Caissier(e): ${userName}`, marginLeft, y); y+=8;
    doc.text(`Date: ${selectDate.value.global.value}`, marginLeft, y); y+=8;
    doc.text(`Montant total: ${formatPrice(total_Amount.value)} Fc`, marginLeft, y); y+=12;
    doc.setDrawColor(0); doc.line(marginLeft, y, 200, y); y+=10;

    doc.setFont('helvetica','bold');
    doc.text('ID', marginLeft, y);
    doc.text('Client', marginLeft + 20, y);
    doc.text('Montant (Fc)', marginLeft + 100, y);
    doc.text('Retour (Fc)', marginLeft + 160, y); y+=8;
    doc.setFont('helvetica','normal');

    todaysInvoices.value.forEach((inv) => {
        doc.text(`${inv.id}`, marginLeft, y);
        doc.text(`${inv.client_name}`, marginLeft+20, y);
        doc.text(`${formatPrice(inv.total_amount)} fc`, marginLeft+100, y);
        doc.text(`${formatPrice(inv.change)} fc`, marginLeft+160, y); y+=8;
        if (y>280) { doc.addPage(); y=20; }
    });
    doc.save(`daily_invoice_report_.pdf`);
}

// --- Dashboards ---
function formatPrice(price){ return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", "); }

function changeDate(date){
    selectDate.value.global.value = date;
    setColorOptions();
    calculateTotalAmount();
    updateLineData();
}


function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const userInvoiceTotals = {};
    const selectedDate = selectDate.value.global.value;

    invoices.value.forEach(inv => {
        const invoiceDate = new Date(inv.created_at).toISOString().split('T')[0];
        if (invoiceDate === selectedDate) {
            const uid = inv.cashier;
            userInvoiceTotals[uid] = (userInvoiceTotals[uid] || 0) + (parseFloat(inv.total_amount) || 0);
        }
    });

    const labels = [];
    const data = [];
    const all = [user.value, ...allUsers.value];

    all.forEach(u => {
        if (u && userInvoiceTotals[u.id]) {
            labels.push(u.username);
            data.push(userInvoiceTotals[u.id]);
        }
    });

    // Palette de couleurs harmonieuses
    const baseColors = [
        'rgba(75, 192, 192, 0.8)', // turquoise
        'rgba(255, 99, 132, 0.8)', // rouge
        'rgba(255, 206, 86, 0.8)', // jaune
        'rgba(54, 162, 235, 0.8)', // bleu
        'rgba(153, 102, 255, 0.8)', // violet
        'rgba(255, 159, 64, 0.8)', // orange
        'rgba(0, 51, 102, 0.9)',   // bleu foncé (pour Total ou valeur par défaut)
        'rgba(128, 128, 128, 0.8)', // gris
        'rgba(0, 128, 0, 0.8)',     // vert foncé
        'rgba(255, 0, 255, 0.8)'    // magenta
    ];

    const backgroundColor = labels.map((_, i) => baseColors[i % baseColors.length]);
    const hoverBackgroundColor = labels.map((_, i) =>
        baseColors[i % baseColors.length].replace('0.8', '1')
    );

    pieData.value = {
        labels,
        datasets: [
            {
                data,
                backgroundColor,
                hoverBackgroundColor
            }
        ]
    };
    pieOptions.value = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Factures par caissier(e)s' }
        }
    };
}


// --- Graph line ---
function formatDateISO(date) { return date.toISOString().split('T')[0]; }

function getWeekRange(date){
    const start = new Date(date); const end = new Date(date);
    start.setDate(start.getDate() - start.getDay() +1);
    end.setDate(end.getDate() - start.getDay() +7);
    return { start, end };
}

function updateLineData() {
    const { start, end } = getWeekRange(selectDate.value.global.value);
    const labels = [];
    const userDataMap = {};
    const all = [user.value, ...allUsers.value];

    // Générer les labels pour la semaine
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        labels.push(formatDateISO(new Date(d)));
    }

    // Initialiser les données des utilisateurs
    all.forEach(u => {
        if (u) userDataMap[u.id] = new Array(labels.length).fill(0);
    });

    // Remplir les données des factures
    invoices.value.forEach(inv => {
        const dateStr = formatDateISO(new Date(inv.created_at));
        const uIndex = all.findIndex(u => u?.id === inv.cashier);
        if (uIndex !== -1) {
            const lIndex = labels.indexOf(dateStr);
            if (lIndex !== -1) {
                userDataMap[all[uIndex].id][lIndex] += parseFloat(inv.total_amount || 0);
            }
        }
    });

    // Calculer le total par date
    const totalData = new Array(labels.length).fill(0);
    labels.forEach((_, i) => {
        all.forEach(u => {
            if (u) totalData[i] += userDataMap[u.id][i];
        });
    });

    const colors = [
        'rgba(75,192,192,1)',
        'rgba(255,99,132,1)',
        'rgba(255,206,86,1)',
        'rgba(54,162,235,1)',
        'rgba(153,102,255,1)',
        'rgba(255,159,64,1)'
    ];

    const datasets = all.map((u, i) => ({
        label: u.username,
        data: userDataMap[u.id],
        fill: false,
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length],
        tension: 0.4
    }));

    // Ligne Total avec une couleur différente (par exemple bleu foncé)
    datasets.push({
        label: 'Total',
        data: totalData,
        fill: false,
        borderColor: 'rgba(0, 51, 102, 0.9)', // bleu foncé
        backgroundColor: 'rgba(0, 51, 102, 0.9)',
        borderWidth: 2,
        tension: 0.4,
        borderDash: [5, 5]
    });

    lineData.value = { labels, datasets };
}


watch([getPrimary, getSurface, isDarkTheme],()=>setColorOptions(),{immediate:true, deep:false});
function forceRefresh() {
   
    localStorage.removeItem(cacheKey('userConnected'));
    localStorage.removeItem(cacheKey('userProfile'));
    localStorage.removeItem(cacheKey('invoices'));
    localStorage.removeItem(cacheKey('invoicesUserConnect'));
    localStorage.removeItem(cacheKey('cashoutList'));
    localStorage.removeItem(cacheKey('childUsers'));

    onMounted(); // Réutilise la logique déjà dans onMounted
}

</script>


<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Carte template -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="block text-gray-500 dark:text-gray-400 text-sm font-medium">Nombres de factures</span>
            <div class="text-gray-900 dark:text-gray-100 font-semibold text-xl">{{ todaysInvoiesUserConnectCaount }}</div>
          </div>
          <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full w-10 h-10">
            <i class="pi pi-shopping-cart text-blue-500 text-lg"></i>
          </div>
        </div>
        <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
          <span>{{ selectDate.global.value }} :</span>
          <span>{{ userConnect }}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="block text-gray-500 dark:text-gray-400 text-sm font-medium">Total</span>
            <div class="text-gray-900 dark:text-gray-100 font-semibold text-xl">
              {{ formatPrice(total_AmountUserConnect) }} {{ userProfile?.currency_preference || 'N/A' }}
            </div>
          </div>
          <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full w-10 h-10">
            <i class="pi pi-arrow-down-left text-green-500 text-lg"></i>
          </div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-auto">
          Total pour aujourd'hui : {{ selectDate.global.value }}
        </div>
      </div>

      <!-- Bénéfice estimé -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="block text-gray-500 dark:text-gray-400 text-sm font-medium">Bénéfice estimé</span>
            <div class="text-gray-900 dark:text-gray-100 font-semibold text-xl">
              {{ formatPrice(total_ProfitAmount) }} {{ userProfile?.currency_preference || 'N/A' }}
            </div>
          </div>
          <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-full w-10 h-10">
            <i class="pi pi-wallet text-yellow-500 text-lg"></i>
          </div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-auto">Newly registered</div>
      </div>

      <!-- Total dépassé -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="block text-red-500 dark:text-red-400 text-sm font-medium">Total dépassé</span>
            <div class="text-red-600 dark:text-red-400 font-semibold text-xl">
              - {{ formatPrice(total_AmountCashOut) }} {{ userProfile?.currency_preference || 'N/A' }}
            </div>
          </div>
          <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-full w-10 h-10">
            <i class="pi pi-arrow-up-right text-red-500 text-lg"></i>
          </div>
        </div>
        <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
          <span>{{ todaysCashoutCount }}</span>
          <span>Nombres des dépasses</span>
        </div>
      </div>
    </div>

    <!-- Date Selector -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      <label for="date-select" class="font-medium">Select Date:</label>
      <InputText id="date-select" type="date" v-model="selectDate.global.value" @change="changeDate(selectDate.global.value)" class="w-full sm:w-auto"/>

        <div class="flex justify-end mb-4 gap-2">
            <Button label="Générer le Rapport" severity="success" @click="generatePDF"/>
            <Button label="Actualiser" severity="warning" @click="forceRefresh"/>
        </div>

    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- Line Chart -->
      <div class="card p-4 shadow-sm rounded-lg flex flex-col h-full">
        <div class="text-lg font-semibold mb-4">Factures pour la semaine</div>
        <Chart type="line" :data="lineData" :options="lineOptions" class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"/>
      </div>

      <!-- Doughnut Chart + Button -->
      <div class="flex flex-col gap-4 h-full">
     
        <div class="card p-4 shadow-sm rounded-lg flex flex-col items-center h-full">
          <div class="text-lg font-semibold mb-4">Factures par Caissier</div>
          <Chart type="doughnut" :data="pieData" :options="pieOptions" class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"/>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Mobile-first adjustments */
@media (max-width: 640px) {
  .p-button {
    width: 100%;
  }
}
</style>
