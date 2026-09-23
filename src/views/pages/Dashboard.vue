<script setup>
import { fetchDashboardAPI, generateReportAPI, getUsersCreatedByMe } from '@/service/Api';
import { computed, onMounted, ref } from 'vue';

// ── Filtres ──

const periodPreset = ref('today')
const selectedDate = ref(null)
const dashboardFile =ref(null);
const currency = ref(null);
const exchangeRate = ref(0);

const allUsers = ref([])

const selectedUser = ref(null)

onMounted(async () => {
    await getDashbord();
    await fetchUsers();
})



async function getDashbord(){
    const response = await fetchDashboardAPI({
        user_id: selectedUser.value?.id,
        current_date: formatDateForAPI(selectedDate.value),    
    })
    
    dashboardFile.value = response;
    currency.value = dashboardFile.value.currency
    exchangeRate.value = dashboardFile.value.exchange_rate;
    console.log('date to API :', dashboardFile.value)
    console.log('date selectionnée:', selectedDate.value)
   
}





function formatDateForAPI(date) {
    if (!date) return null

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}


async function initializationDate(){
    selectedDate.value = null;
    await getDashbord()
}

// pour les utilisateurs

async function fetchUsers(){
    allUsers.value = await getUsersCreatedByMe()
    console.log('utilisateur pour cette utilisateur :',users.value)
}

const users = computed(() => allUsers.value)

// ── Config visuelle des statuts ──
const statusConfig = {
  ADMIN: { label: 'Admin', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  GESTIONNAIRE_STOCK: { label: 'Gestionnaire', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  CAISSIER: { label: 'Caissier', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
}

function getStatusConfig(status) {
  return statusConfig[status] || { label: status || '—', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
}

function getInitial(username) {
  return username ? username.charAt(0).toUpperCase() : '?'
}


const periodOptions = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Personnalisé', value: 'custom' },
]


// ── Données (à remplacer par vos vraies données / API) ──
const stats = computed( () => ({
  invoicesCount:dashboardFile.value?.summary?.invoice_count,
  totalAmount: dashboardFile.value?.summary?.total_sales,
  totalPaid:dashboardFile.value?.summary?.total_paid,
  profit: dashboardFile.value?.summary?.total_profit,
  cancelledInvoicesCount: dashboardFile.value?.summary?.canceled_count,
  cancelledAmount: dashboardFile.value?.summary?.total_amount_canceled,
  totalTva:dashboardFile.value?.summary?.total_tva,
  totalChange:dashboardFile.value?.summary.total_change,
  exitUsd: dashboardFile.value?.summary?.total_cashout_usd,
  exitCdf: dashboardFile.value?.summary?.total_cashout_cdf,
  entryUsd: dashboardFile.value?.summary?.total_entryNote_usd,
  entryCdf: dashboardFile.value?.summary?.total_entryNote_cdf,
}))



const isGenerating = ref(false)

async function generateReport() {
  isGenerating.value = true
  // TODO: brancher l'appel API réel de génération de rapport

  try{

    const pdfBlob = await generateReportAPI({
      user_id: selectedUser.value?.id,
      current_date: formatDateForAPI(selectedDate.value)
    })

    const blob = new Blob( [pdfBlob], { type: 'application/pdf' } );
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapport_journalier.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  }catch(error){
     console.error( "Erreur lors du téléchargement du rapport :", error );
  }finally{
    isGenerating.value = false
  }
}

// ── Formatage des montants ──
function formatCompact(value, currency = null) {
  if (value === null || value === undefined) return '—'
  const formatter = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  return currency ? `${formatter.format(value)} ${currency}` : formatter.format(value)
}



const displayCurrency = ref({})

function getDisplayCurrency(cardKey) {
    return displayCurrency.value[cardKey] || currency.value
}


function toggleCurrency(cardKey) {
    const current = getDisplayCurrency(cardKey)

    displayCurrency.value[cardKey] =
        current === 'CDF' ? 'USD' : 'CDF'
}

function getTargetCurrency(cardKey) {
    const current = getDisplayCurrency(cardKey)

    return current === 'CDF' ? 'USD' : 'CDF'
}

function convertedValue(amount, cardKey) {
    const targetCurrency = getDisplayCurrency(cardKey)

    if (targetCurrency === currency.value) {
        return amount
    }
    if (currency.value === 'CDF' && targetCurrency === 'USD') {
        return amount / exchangeRate.value
    }

    if (currency.value === 'USD' && targetCurrency === 'CDF') {
        return amount * exchangeRate.value
    }

    return amount
}



function formatFull(value, currency = null) {
  if (value === null || value === undefined) return '—'
  const formatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  })
  return currency ? `${formatter.format(value)} ${currency}` : formatter.format(value)
}






// ── Cartes ──
const cards = computed(() => [
  {
    key: 'invoices',
    label: 'Factures émises',
    icon: 'pi pi-check-circle',
    color: 'indigo',
    value: formatFull(stats.value.invoicesCount),
    full: formatFull(stats.value.invoicesCount),
    sub: 'Total sur la période',
  },

  {
    key: 'total',
    label: 'Montant total',
    icon: 'pi pi-calculator',
    color: 'emerald',
    value: formatFull(stats.value.totalAmount, currency.value),
    full: formatFull(stats.value.totalAmount, currency.value),
    sub: 'Chiffre d\'affaires brut',
    baseAmount: stats.value.totalAmount,
    convertible: true,
  },
  {
    key:'cash',
    label:'Cash disponible',
    icon:'pi pi-wallet',
    color:'emerald',
    value: formatFull(stats.value.totalPaid, currency.value),
    sub:'cash disponible en caisse',
    baseAmount:stats.value.totalPaid,
    convertible:true
  },

  {
    key: 'profit',
    label: 'Bénéfice',
    icon: 'pi pi-chart-line',
    color: 'teal',
    value: formatFull(stats.value.profit, currency.value),
    full: formatFull(stats.value.profit, currency.value),
    sub: 'Marge nette estimée',
    baseAmount:stats.value.profit,
    convertible:true
  },

  {
    key: 'cancelledCount',
    label: 'Factures annulées',
    icon: 'pi pi-times-circle',
    color: 'rose',
    value: formatFull(stats.value.cancelledInvoicesCount),
    full: formatFull(stats.value.cancelledInvoicesCount),
    sub: 'Nombre d\'annulations',
  },
  {
    key: 'cancelledAmount',
    label: 'Montant annulé',
    icon: 'pi pi-undo',
    color: 'orange',
    value: formatFull(stats.value.cancelledAmount, currency.value),
    full: formatFull(stats.value.cancelledAmount, currency.value),
    sub: 'Total des annulations',
  },
  {
    key: 'net',
    label: 'Tva net',
    icon: 'pi pi-percentage',
    color: 'violet',
    value: formatFull(stats.value.totalTva, currency.value),
    full: formatFull(stats.value.totalTva, currency.value),
    sub: 'TVA',
    baseAmount:stats.value.totalTva,
    convertible:true
  },

   {
    key: 'change',
    label: 'total reste(remise)',
    icon: 'pi pi-refresh',
    color: 'sky',
    value: formatFull(stats.value.totalChange, currency.value),
    full: formatFull(stats.value.totalChange, currency.value),
    sub: 'remise',
    baseAmount:stats.value.totalChange,
    convertible:true
  },
  
  {
    key: 'exit',
    label: 'Bon de sortie USD/CDF',
    icon: 'pi pi-arrow-up-right',
    color:'orange',
    dual: [
      { currency: 'USD', amount: stats.value.exitUsd },
      { currency: 'CDF', amount: stats.value.exitCdf },
    ],
    sub: 'Sorties de stock / caisse ',
  },
  {
    key: 'entry',
    label: 'Bon d\'entrée USD/CDF',
    icon: 'pi pi-arrow-down-left',
    color: 'sky',
    dual: [
      { currency: 'USD', amount: stats.value.entryUsd },
      { currency: 'CDF', amount: stats.value.entryCdf },
    ],
    sub: 'Entrées de stock / caisse ',
  },
    

])

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
}


//====== graphiques ==========

const lineData = computed(() =>{
    const cashierData = dashboardFile.value?.cashier_sales_last_7_days || [];

    const salesDates = cashierData[0]?.sales || [];

    const labels = salesDates.map((item) => {
        const date = new Date(item.date + 'T00:00:00')

        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
        })
    })

    const datasets = cashierData.map((cashier, index) => {
        const colors = [
            '#004D4A',
            '#f59e0b',
            '#0ea5e9',
            '#f43f5e',
            '#8b5cf6',
            '#ec4899',
            '#14b8a6',
            '#f97316',
        ]
        const color = colors[index % colors.length]

        return {
            label: cashier.username,

            data: cashier.sales.map(
                sale => Number(sale.total_sales || 0)
            ),

            fill: false,

            borderColor: color,

            backgroundColor: color,

            tension: 0.4,

            pointBackgroundColor: color,

            pointBorderColor: '#ffffff',

            pointBorderWidth: 2,

            pointRadius: 4,

            pointHoverRadius: 6,

            borderWidth: 2.5,
        }
    })

    return {
        labels,
        datasets,
    } 
})

const lineOptions = ref({
    maintainAspectRatio: false,
    responsive: true,

    animation: {
        duration: 1200,
        easing: 'easeOutQuart',
    },

    plugins: {
        legend: {
            display: true,
            position: 'top',

            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,

                color: '#475569',

                font: {
                    size: 12,
                    weight: '600',
                },
            },
        },

        tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 10,

            titleFont: {
                size: 12,
                weight: '600',
            },

            bodyFont: {
                size: 13,
                weight: '600',
            },

            callbacks: {
                label: (ctx) => {

                    const currency =
                        dashboardFile.value?.currency || 'CDF'

                    return ` ${
                        new Intl.NumberFormat('fr-FR').format(
                            ctx.parsed.y
                        )
                    } ${currency}`
                },
            },
        },
    },

    scales: {
        x: {
            grid: {
                display: false,
            },

            ticks: {
                color: '#94a3b8',

                font: {
                    size: 12,
                },
            },
        },

        y: {
            beginAtZero: true,

            grid: {
                color: '#f1f5f9',
            },

            ticks: {
                color: '#94a3b8',

                font: {
                    size: 12,
                },

                callback: (value) => {
                    return new Intl.NumberFormat('fr-FR', {
                        notation: 'compact',
                    }).format(value)
                },
            },
        },
    },
})



// ── Chart DOUGHNUT : répartition des transactions ──

const doughnutData = computed(() => {
    const cashiers = dashboardFile.value?.cashiers || [];
    
    return {
        labels: cashiers.map(cashier => cashier.username),

        datasets: [
            {
                data: cashiers.map(cashier => cashier.total_sales ),
                
                backgroundColor: [
                    '#004D4A',
                    '#f59e0b',
                    '#0ea5e9',
                    '#f43f5e',
                    '#8b5cf6',
                    '#ec4899',
                    '#14b8a6',
                    '#f97316',
                ],
                
                hoverBackgroundColor: [
                    '#00615c',
                    '#fbbf24',
                    '#38bdf8',
                    '#fb7185',
                    '#a78bfa',
                    '#f472b6',
                    '#2dd4bf',
                    '#fb923c',
                ],
                borderWidth: 0,
                borderRadius: 4,
                spacing: 3,
            }
        ]
    }

})


const doughnutOptions = ref({
    responsive: true,
    maintainAspectRatio: false,

    cutout: '68%',

    animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: 'easeOutQuart',

        delay: (context) => {
            return context.dataIndex * 150
        },
    },

    plugins: {
        legend: {
            display: true,
            position: 'bottom',

            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                color: '#475569',

                font: {
                    size: 12,
                    weight: '500',
                },
            },
        },

        tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 10,

            callbacks: {
                label: (ctx) => {
                    const currencyValue =
                        dashboardFile.value?.currency || 'CDF'

                    return ` ${
                        new Intl.NumberFormat('fr-FR').format(ctx.parsed)
                    } ${currencyValue}`
                },
            },
        },
    },
})





</script>


<template>

  <div class="min-h-screen bg-slate-50 px-5 md:px-8 py-8">
    <!-- HEADER PAGE -->
    <div class="max-w-7xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3">

    <div>
      <p class="text-sm font-semibold text-[#004D4A] tracking-wide mb-3">
        Tableau de bord
      </p>

      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold text-slate-900 tracking-tight">
          Activité
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#004D4A] bg-[#004D4A]/8 tracking-wide uppercase">
          <span class="w-1.5 h-1.5 rounded-full bg-[#004D4A] animate-pulse"></span>
          Bêta
        </span>
      </div>
    </div>

      <!-- Taux du jour -->
      <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
        <i class="pi pi-sync text-slate-400 text-sm"></i>
        <span class="text-xs text-slate-500">Taux du jour :</span>
        <span class="text-sm font-semibold text-slate-900">
          1 USD = {{ formatFull(exchangeRate) }} CDF
        </span>
      </div>
    </div>

    <!-- BARRE DE FILTRES -->
   <div class="max-w-7xl mx-auto mb-8">
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
    <div class="flex flex-col lg:flex-row lg:items-end gap-4">

      <div class="flex flex-col gap-1.5 w-full lg:w-64">
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Utilisateur
        </label>

        <Dropdown
          v-model="selectedUser"
          :options="users"
          optionLabel="username"
          placeholder="Tous les utilisateurs"
          showClear
          class="w-full"
          @change="getDashbord"
        >
          <template #value="{ value }">
            <div v-if="value" class="flex items-center gap-2.5">
              <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[#004D4A]/10 text-[#004D4A] text-xs font-semibold flex-shrink-0">
                {{ getInitial(value.username) }}
              </div>
              <span class="text-sm font-medium text-slate-800 truncate">{{ value.username }}</span>
              <span
                class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                :class="[getStatusConfig(value.status).bg, getStatusConfig(value.status).text]"
              >
                <span class="w-1 h-1 rounded-full" :class="getStatusConfig(value.status).dot"></span>
                {{ getStatusConfig(value.status).label }}
              </span>
            </div>
            <span v-else class="text-sm text-slate-400">Tous les utilisateurs</span>
          </template>

          <template #option="{ option }">
            <div class="flex items-center gap-3 py-1">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#004D4A]/10 text-[#004D4A] text-xs font-semibold flex-shrink-0">
                {{ getInitial(option.username) }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium text-slate-800 truncate">{{ option.username }}</span>
                <span class="text-xs text-slate-400 truncate">{{ option.email }}</span>
              </div>
              <span
                class="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
                :class="[getStatusConfig(option.status).bg, getStatusConfig(option.status).text]"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="getStatusConfig(option.status).dot"></span>
                {{ getStatusConfig(option.status).label }}
              </span>
            </div>
          </template>
        </Dropdown>
      </div>

      <div class="flex flex-col gap-1.5 w-full lg:w-72">
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Date
        </label>
        <Calendar
          v-model="selectedDate"
          selectionMode="single"
          :manualInput="false"
          dateFormat="dd/mm/yy"
          showIcon
          class="w-full"
          placeholder="Choisir une date"
          @date-select="getDashbord"
        />
      </div>

      <!-- GRID DES CARTES
        <div class="flex flex-col gap-1.5 w-full lg:flex-1">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Rechercher
          </label>
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search" />
            <InputText placeholder="N° facture, client, caissier..." class="w-full" />
          </IconField>
        </div>
      -->

      <!-- Espaceur : pousse les boutons vers l'extrémité droite -->
      <div class="hidden lg:block lg:flex-1"></div>

      <div class="flex items-center gap-2 w-full lg:w-auto">
        <Button
          icon="pi pi-filter-slash"
          label="Réinitialiser"
          outlined
          severity="secondary"
          class="!rounded-xl w-full lg:w-auto"
          @click="initializationDate"
        />
        <Button
          icon="pi pi-file-export"
          :label="isGenerating ? 'Génération...' : 'Générer le rapport'"
          :loading="isGenerating"
          class="!rounded-xl !bg-[#004D4A] !border-none w-full lg:w-auto"
          @click="generateReport"
        />
      </div>

    </div>
  </div>
</div>
    <!-- GRID DES CARTES -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

      <div
        v-for="card in cards"
        :key="card.key"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-300"
      >
        <!-- Header carte -->
        <div class="flex items-center justify-between">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            :class="[colorMap[card.color].bg, colorMap[card.color].text]"
          >
            <i :class="card.icon" class="text-base"></i>
          </div>

          <!-- Bouton de conversion -->
          <button
            v-if="card.convertible"
            type="button"
            @click="toggleCurrency(card.key)"
            class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold
                   bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <i class="pi pi-sync text-[10px]"></i>
            {{ getTargetCurrency(card.key) }}
          </button>
        </div>

        <!-- Label -->
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            {{ card.label }}
          </p>

          <!-- Valeur simple non convertible -->
          <p
            v-if="!card.dual && !card.convertible"
            class="text-2xl font-bold text-slate-900 leading-tight break-words"
          >
            {{ card.value }}
          </p>

          <!-- Valeur convertible (bascule USD/CDF) -->
          <p
            v-else-if="card.convertible"
            class="text-2xl font-bold text-slate-900 leading-tight break-words"
          >
            {{ formatFull(
              convertedValue(card.baseAmount, card.key),
              getDisplayCurrency(card.key)
            ) }}
          </p>

          <!-- Valeur double devise fixe -->
          <div v-else-if="card.dual" class="flex flex-col gap-1">
            <p
              v-for="(d, i) in card.dual"
              :key="i"
              class="text-lg font-bold text-slate-900 leading-tight break-words"
            >
              {{ formatFull(d.amount, d.currency) }}
            </p>
          </div>

          <p class="text-xs text-slate-400 mt-1.5">
            {{ card.sub }}
          </p>
        </div>
      </div>

    </div>

    <!-- GRAPHIQUES -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- LINE CHART : évolution CA -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Évolution du chiffre d'affaires</h3>
            <p class="text-xs text-slate-400 mt-0.5">7 derniers jours</p>
          </div>
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-[#004D4A]/8 text-[#004D4A]">
            <i class="pi pi-chart-line text-sm"></i>
          </div>
        </div>
        <div class="h-72">
          <Chart type="line" :data="lineData" :options="lineOptions" class="w-full h-full" />
        </div>
      </div>

      <!-- DOUGHNUT CHART : répartition -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Ventes par caissier</h3>
            <p class="text-xs text-slate-400 mt-0.5">Répartition des ventes</p>
          </div>
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500">
            <i class="pi pi-chart-pie text-sm"></i>
          </div>
        </div>
        <div class="h-72">
            
          <Chart type="doughnut" :data="doughnutData" :options="doughnutOptions" class="w-full h-full" />
        </div>
      </div>

    </div>

  </div>

</template>

